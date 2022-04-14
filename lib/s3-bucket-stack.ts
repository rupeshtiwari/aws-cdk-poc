import {
  aws_s3 as s3,
  RemovalPolicy,
  Stack,
  StackProps,
  aws_iam as iam,
  aws_s3_deployment as s3deploy,
} from 'aws-cdk-lib';
import { Construct } from 'constructs';
const BUCKET_NAME = 'octank-sdp-job-bucket';

export class S3BucketStack extends Stack {
  bucket: s3.Bucket;
  glueRole: iam.Role;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
    this.bucket = this.createS3Bucket();
    this.glueRole = this.createGlueRole();
    this.assignPermission(this.bucket, this.glueRole);
    this.uploadFilesToS3(this.bucket);
  }

  private assignPermission(bucket: s3.Bucket, role: iam.Role) {
    bucket.grantReadWrite(role);
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

  private uploadFilesToS3(bucket: s3.Bucket) {
    new s3deploy.BucketDeployment(this, 'DeployGlueJobFiles', {
      sources: [s3deploy.Source.asset('./assets')],
      destinationBucket: bucket,
      destinationKeyPrefix: 'assets',
    });
  }
}
