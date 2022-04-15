import { Stage, StageProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Cloud9Stack } from './infrastructure/cloud9-stack';
import { GlueStack } from './infrastructure/glue-stack';
import { KafkaStack } from './infrastructure/kafka-stack';
import { RoleStack } from './infrastructure/role-stack';
import { S3BucketStack } from './infrastructure/s3-bucket-stack';
import { S3OutputBucketStack } from './infrastructure/s3-output-bucket-stack';
import { VpcStack } from './infrastructure/vpc-stack';

export class MyPipelineStage extends Stage {
  constructor(scope: Construct, stageName: string, props?: StageProps) {
    super(scope, stageName, props);
    this.createStacks(this, stageName);
  }

  private createStacks(app: Construct, stageName: string) {
    console.log(`Stage Name is: ${stageName}`);

    const roleStack = this.createRoleStack(app);
    const vpcStack = this.CreateVpcStack(app);

    this.CreateCloud9Stack(vpcStack, app);

    const s3BucketStack = this.CreateS3BucketStack(app, roleStack);
    const s3OutputBucketStack = this.CreateS3OutputBucketStack(app, roleStack);

    const kafkaStack = this.CreateKafkaStack(vpcStack, app);
    const glueStack = this.CreateGlueStack(
      s3BucketStack,
      s3OutputBucketStack,
      vpcStack,
      kafkaStack,
      roleStack,
      app
    );
    glueStack.addDependency(s3BucketStack)
    glueStack.addDependency(s3OutputBucketStack);
    console.log(`${glueStack.stackName} created`);
  }

  private createRoleStack(app: Construct): RoleStack {
    return new RoleStack(app, 'OctankPocRoleStack');
  }

  private CreateVpcStack(app: Construct) {
    return new VpcStack(app, 'OctankPocVpcStack');
  }

  private CreateCloud9Stack(vpcStack: VpcStack, app: Construct) {
    const cloud9Stack = new Cloud9Stack(vpcStack, app, 'OctankPocCloud9Stack');
    cloud9Stack.addDependency(vpcStack);
  }

  private CreateS3BucketStack(app: Construct, roleStack: RoleStack) {
    const bucketStack = new S3BucketStack(roleStack, app, 'OctankPocS3Stack');

    return bucketStack;
  }

  private CreateS3OutputBucketStack(app: Construct, roleStack: RoleStack) {
    const bucketStack = new S3OutputBucketStack(
      roleStack,
      app,
      'OctankPocS3OutputStack'
    );

    return bucketStack;
  }

  private CreateGlueStack(
    s3bucket: S3BucketStack,
    s3outputBucketStack: S3OutputBucketStack,
    vpcStack: VpcStack,
    kafkaStack: KafkaStack,
    roleStack: RoleStack,
    app: Construct
  ) {
    return new GlueStack(
      vpcStack,
      s3bucket,
      s3outputBucketStack,
      kafkaStack,
      roleStack,
      app,
      'OctankPocGlueStack'
    );
  }

  private CreateKafkaStack(vpcStack: VpcStack, app: Construct) {
    const kafkaStack = new KafkaStack(vpcStack, app, 'OctankPocKafkaStack');
    kafkaStack.addDependency(vpcStack);

    return kafkaStack;
  }
}
