import { aws_s3 as s3, RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import { RoleStack } from './role-stack';
const BUCKET_NAME = 'octank-sdp-job-output-bucket';
const BUCKET_ID = 'MyCdkGlueJobOutputBucket';
export class S3OutputBucketStack extends Stack {
  bucket: s3.Bucket;
  constructor(
    roleStack: RoleStack,
    scope: Construct,
    id: string,
    props?: StackProps
  ) {
    super(scope, id, props);

    if (this.isBucketExist) return;

    this.bucket = this.createS3Bucket();
    this.bucket.grantReadWrite(roleStack.glueRole);
  }

  private createS3Bucket() {
    return new s3.Bucket(this, BUCKET_ID, {
      versioned: false,
      bucketName: BUCKET_NAME,
      removalPolicy: RemovalPolicy.RETAIN,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      autoDeleteObjects: false,
    });
  }
  // Since we are retaining the bucket, It is important to check if bucket alread present then do not try to create bucket again that will throw error. 
  private get isBucketExist() {
    this.bucket = s3.Bucket.fromBucketName(
      this,
      BUCKET_ID,
      BUCKET_NAME
    ) as Bucket;
    if (this.bucket) return true;

    return false;
  }
}
