import {
  aws_iam as iam,
  aws_s3 as s3,
  Stack,
  StackProps,
  aws_glue as glue,
  aws_s3_deployment as s3deploy,
  RemovalPolicy,
} from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as path from 'path';

const GLUE_VERSION = '3.0';

//This value must be glueetl for Apache Spark
const COMMAND_NAME = 'glueetl';
const SPARKAVRO_PATH = 'jars/spark-avro_2.12-3.1.2.jar';
const BUCKET_NAME = 'octank-poc-bucket';

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
      command: {
        name: COMMAND_NAME,
        scriptLocation: `s3://${bucketName}/spark/streaming.scala`,
      },
      glueVersion: GLUE_VERSION,
      defaultArguments: {
        '--extra-jars': `s3://${bucketName}/${SPARKAVRO_PATH}`,
        '--executor-cores': 8,
      },
      numberOfWorkers: 30,
    });
  }

  private createS3Bucket() {
    const myBucket = new s3.Bucket(this, 'MyCdkGlueJobBucket', {
      versioned: true,
      bucketName: 'octank-sdp-job-bucket',
      removalPolicy: RemovalPolicy.RETAIN,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    });

    return myBucket;
  }

  private uploadFilesToS3(bucket: s3.Bucket) {
    new s3deploy.BucketDeployment(this, 'DeployGlueJobFiles', {
      sources: [s3deploy.Source.asset(path.join(__dirname, '../assets'))],
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
