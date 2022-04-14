import { aws_s3 as s3, RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
const BUCKET_NAME = 'octank-sdp-job-output-bucket';

export class S3BucketStack extends Stack {
  bucket: s3.Bucket;
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
    this.bucket = this.createS3Bucket();
  }

  private createS3Bucket() {
    return new s3.Bucket(this, 'MyCdkGlueJobOutputBucket', {
      versioned: true,
      bucketName: BUCKET_NAME,
      removalPolicy: RemovalPolicy.RETAIN,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      autoDeleteObjects: true,
    });
  }
}
