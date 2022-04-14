import com.amazonaws.services.glue.DynamicFrame
import com.amazonaws.services.glue.GlueContext
import com.amazonaws.services.glue.errors.CallSite
import com.amazonaws.services.glue.util.GlueArgParser
import com.amazonaws.services.glue.util.Job
import com.amazonaws.services.glue.util.JsonOptions
import java.util.Calendar
import org.apache.spark.SparkContext
import org.apache.spark.sql.Dataset
import org.apache.spark.sql.Row
import org.apache.spark.sql.SaveMode
import org.apache.spark.sql.streaming.Trigger
import scala.collection.JavaConverters._

import com.amazonaws.ClientConfiguration
import com.amazonaws.auth.DefaultAWSCredentialsProviderChain
import com.amazonaws.client.builder.AwsClientBuilder.EndpointConfiguration
import com.amazonaws.services.glue.hadoop.PartitionFilesLister
import com.amazonaws.services.glue.util._
import com.amazonaws.services.glue._
import com.amazonaws.services.lakeformation.model._
import com.amazonaws.services.lakeformation.{
  AWSLakeFormation,
  AWSLakeFormationClient
}
import org.apache.hadoop.conf.Configuration
import org.apache.hadoop.fs.FileStatus
import org.apache.spark.SparkContext
import org.apache.spark.sql.functions._
import org.apache.spark.sql.avro.functions._
import org.apache.spark.sql.{SQLContext, SparkSession}
import org.apache.spark.sql.types.{
  StructType,
  StringType,
  IntegerType,
  LongType
}
import org.apache.spark.sql.{DataFrame, Dataset}
import org.apache.spark.sql.functions.udf

import org.apache.spark.sql.streaming.{
  DataStreamWriter,
  StreamingQueryException,
  Trigger
}

import scala.collection.JavaConversions._

case class ASN(asn: String, asn_name: String)
case class Country(continent_name: String, country_name: String)

object GlueApp {
  val ts = System.currentTimeMillis()
  val offsetSize = "900000000"

  val dbName = "bb"
  val tableName = "table4"

  def main(sysArgs: Array[String]) {
    val spark = SparkSession.builder().getOrCreate()
    val glueContext: GlueContext = new GlueContext(spark.sparkContext)
    val args = GlueArgParser.getResolvedOptions(
      sysArgs,
      Seq("JOB_NAME", "bucket_name","brokers","topic").toArray
    )
    val s3bucketName = args("bucket_name")
    val brokers = args("brokers")
    val topic = args("topic")
    val s3BasePath = s"s3://${s3bucketName}/"
    val checkpointsFolder = "checkpoints/"
    val checkpointSuffix = "/load_test_checkpoint_with_enrichment_" + ts
    val s3checkpoint =
      s3BasePath + checkpointsFolder + tableName + checkpointSuffix
    val s3Output = s"${s3BasePath}/${tableName}/"

    Job.init(args("JOB_NAME"), glueContext, args.asJava)

    // Ref Data - IP Netzone
    val ipSchema: StructType = new StructType()
      .add("ip", StringType, nullable = true)
      .add("cidr", StringType, nullable = true)
      .add("zone", StringType, nullable = true)
      .add("area", StringType, nullable = true)
      .add("__size", StringType, nullable = true)

    val ipDF: DataFrame = spark.read
      .format("csv")
      .option("header", true)
      .schema(ipSchema)
      .load(s"${s3BasePath}/data/enrich_ip_netzone_2021-12-02.csv")

    val netzoneDF: DataFrame = broadcast(ipDF.persist())

    val valueSchema: String = """
    {
        "namespace":"netflow.avro",
        "type":"record",
        "name": "netflow",
        "fields":[
            { "name":"event_type","type": "string"},
            {"name":"peer_ip_src","type":"string"},
            {"name":"ip_src","type":"string"},
            {"name":"ip_dst","type":"string"},
            {"name":"port_src", "type":"long"},
            { "name":"port_dst","type":"long"},
            {"name":"tcp_flags","type": "long"},
            { "name":"ip_proto","type":"string"},
            {"name":"timestamp_start","type":"string"},
            {"name":"timestamp_end","type":"string"},
            {"name":"timestamp_arrival","type":"string"},
            {"name":"export_proto_seqno","type":"long"},
            {"name":"export_proto_version","type":"long"},
            { "name":"packets","type":"long"},
            {"name":"flows","type":"long"},
            {"name":"bytes","type":"long"},
            { "name":"writer_id","type":"string"}
            ]
    }
    """

    val options_read: Map[String, String] = Map(
      "kafka.bootstrap.servers" -> brokers,
      "subscribe" -> topic,
      "startingOffsets" -> "earliest",
      // "kafka.security.protocol" -> "SSL",
      "maxOffsetsPerTrigger" -> offsetSize,
      "pollTimeoutMs" -> "100000"
    )

    val data_frame_datasource0 = spark.readStream
      .format("kafka")
      .options(options_read)
      .load()
      .select(col("timestamp"), from_avro(col("value"), valueSchema).as("data"))
      .select("timestamp", "data.*")

    data_frame_datasource0.writeStream
      .foreachBatch((df: Dataset[Row], batchId: Long) => {

        val dataFrameWithAddedColumns: DataFrame = df
          .withColumn("ts", to_timestamp(col("timestamp")))
          .withColumn("year", year(col("ts")))
          .withColumn("month", month(col("ts")))
          .withColumn("day", dayofmonth(col("ts")))
          .withColumn("hour", hour(col("ts")))
          .drop("ts")

        // ENRICHMENT: internal ipDFCached (netzone)
        val enrichedDataFrame: DataFrame =
          dataFrameWithAddedColumns
            .alias("a")
            .join(netzoneDF.alias("b"), col("a.ip_src") === col("b.ip"), "left")
            .select(
              col("a.*"),
              col("b.zone").alias("src_zone"),
              col("b.area").alias("src_area")
            )

        val joinedDataframe: DataFrame =
          enrichedDataFrame
            .alias("a")
            .join(netzoneDF.alias("b"), col("a.ip_dst") === col("b.ip"), "left")
            .select(
              col("a.*"),
              col("b.zone").alias("dst_zone"),
              col("b.area").alias("dst_area")
            )

        joinedDataframe.write
          .mode("append")
          .partitionBy("year", "month", "day", "hour")
          .parquet(s3Output)
        // joinedDataframe.write.mode("append").partitionBy("year","month", "day", "hour").option("path", s3Output).format("parquet").saveAsTable(s"$dbName.$tableName")
      })
      .trigger(Trigger.ProcessingTime("10 seconds"))
      .option("checkpointLocation", s3checkpoint)
      .start()
      .awaitTermination()

  }

}
