import {
  aws_s3 as s3,
  aws_s3_deployment as s3deploy,
  RemovalPolicy,
  Stack,
  StackProps,
} from 'aws-cdk-lib';
import { Construct } from 'constructs';
const BUCKET_NAME = 'octank-sdp-job-bucket';

export class S3BucketStack extends Stack {
  bucket: s3.Bucket;
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
    this.bucket = this.createS3Bucket();

    this.uploadFilesToS3(this.bucket);
  }

  private createS3Bucket() {
    return new s3.Bucket(this, 'MyCdkGlueJobBucket', {
      versioned: true,
      bucketName: BUCKET_NAME,
      removalPolicy: RemovalPolicy.DESTROY,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      autoDeleteObjects: true,
    });
  }

  private uploadFilesToS3(bucket: s3.Bucket) {
    new s3deploy.BucketDeployment(this, 'DeployGlueJobFiles', {
      sources: [s3deploy.Source.asset('./assets')],
      destinationBucket: bucket,
      destinationKeyPrefix: 'assets',
    });
  }
}
