import { aws_iam as iam, aws_s3 as s3, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';

export class PocStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
    this.createStack();
  }

  createStack() {
    const role = this.createGlueRole();
    this.assignPermisssion(role);
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

  private assignPermisssion(role: iam.Role) {
    const dataBucketName = 'octank-poc-bucket';

    // Assign permission to data bucket
    const dataS3Bucket = s3.Bucket.fromBucketName(
      this,
      'existingBucket',
      dataBucketName
    );

    dataS3Bucket.grantReadWrite(role);
  }
}
