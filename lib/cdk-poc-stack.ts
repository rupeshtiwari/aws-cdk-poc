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

const GLUE_VERSION = '3.0';

//This value must be glueetl for Apache Spark
const COMMAND_NAME = 'glueetl';
const SPARKAVRO_PATH = 'jars/spark-avro_2.12-3.1.2.jar';
const BUCKET_NAME = 'octank-sdp-job-bucket';

export class PocStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
    this.createStack();
  }

  createStack() {
    const role = this.createGlueRole();
    const bucket = this.createS3Bucket();
    this.uploadFilesToS3(bucket);
    this.assignPermission(bucket, role);
    this.createGlueJob(bucket, role);
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
      },
      // Please set both Worker Type and Number of Workers.
      numberOfWorkers: 30,
      workerType: 'G.1X',
    });
  }

  private createS3Bucket() {
    const myBucket = new s3.Bucket(this, 'MyCdkGlueJobBucket', {
      versioned: true,
      bucketName: BUCKET_NAME,
      removalPolicy: RemovalPolicy.DESTROY,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      autoDeleteObjects: true,
    });

    return myBucket;
  }

  private uploadFilesToS3(bucket: s3.Bucket) {
    new s3deploy.BucketDeployment(this, 'DeployGlueJobFiles', {
      sources: [s3deploy.Source.asset('./assets')],
      destinationBucket: bucket,
      destinationKeyPrefix: 'assets',
    });
  }

  private createGlueRole() {
    // Create a new Role for Glue
    const role = new iam.Role(this, 'access-glue-poc', {
      assumedBy: new iam.ServicePrincipal('glue.amazonaws.com'),
    });

    // Add AWSGlueServiceRole to role.
    const gluePolicy = iam.ManagedPolicy.fromAwsManagedPolicyName(
      'service-role/AWSGlueServiceRole'
    );
    role.addManagedPolicy(gluePolicy);

    return role;
  }

  private assignPermission(bucket: s3.Bucket, role: iam.Role) {
    bucket.grantReadWrite(role);
  }
}
