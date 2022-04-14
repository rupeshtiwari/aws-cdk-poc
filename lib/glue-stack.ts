import {
  aws_iam as iam,
  aws_s3 as s3,
  Stack,
  StackProps,
  aws_glue as glue,
  aws_s3_deployment as s3deploy,
  RemovalPolicy,
  AssetOptions,
} from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as path from 'path';
import { KafkaStack } from './kafka-stack';
import { S3BucketStack } from './s3-bucket-stack';

//This value must be glueetl for Apache Spark
const COMMAND_NAME = 'glueetl';
const SPARKAVRO_PATH = 'jars/spark-avro_2.12-3.1.2.jar';

const GLUE_VERSION = '3.0';

export class GlueStack extends Stack {
  constructor(
    private s3Stack: S3BucketStack,
    private kafkaStack: KafkaStack,
    scope: Construct,
    id: string,
    props?: StackProps
  ) {
    super(scope, id, props);
    this.createGlueJob(s3Stack.bucket, s3Stack.glueRole);
  }

  private createGlueJob(bucket: s3.Bucket, role: iam.Role) {
    const bucketName = bucket.bucketName;
    const streamKafkaEventJobName = 'stream-kafka-events';
    const streamKafkaEventJob = new glue.CfnJob(this, streamKafkaEventJobName, {
      name: streamKafkaEventJobName,
      role: role.roleArn,
      description: 'Octank Security Data Platform Job',
      command: {
        name: COMMAND_NAME,
        scriptLocation: `s3://${bucketName}/assets/spark/streaming.scala`,
      },
      glueVersion: GLUE_VERSION,
      defaultArguments: {
        '--extra-jars': `s3://${bucketName}/assets/${SPARKAVRO_PATH}`,
        '--executor-cores': 8,
        '--enable-metrics': true,
        '--enable-continuous-cloudwatch-log': true,
        '--enable-spark-ui': true,
        '-enable-auto-scaling': true,
        '--job-language': 'scala',
        '--brokers': this.kafkaStack.kafkaCluster,
        '--topic': 'netflow20',
        '--bucket_name': this.s3Stack.bucket.bucketName,
      },
      // Please set both Worker Type and Number of Workers.
      numberOfWorkers: 30,
      workerType: 'G.1X',
    });
  }
}
