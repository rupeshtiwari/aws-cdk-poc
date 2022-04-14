import {
  aws_cloud9 as cloud9, aws_ec2 as ec2, aws_msk as msk, Stack,
  StackProps
} from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { VpcStack } from './vpc-stack';

export class Cloud9Stack extends Stack {
  public kafkaCluster: msk.CfnCluster;

  constructor(
    private vpcStack: VpcStack,
    scope: Construct,
    id: string,
    props?: StackProps
  ) {
    super(scope, id, props);
    this.createCloud9();
  }

  private createCloud9() {
    const subnetId = this.subnetId;
    const c9env = new cloud9.CfnEnvironmentEC2(this, 'OctankPocEnv', {
      name: 'OctankPocEnv',
      instanceType: 'm5.large',
      automaticStopTimeMinutes: 360,
      description:
        'cloud9 environment for Octank to publish events on kafka topic',
      subnetId,

      tags: [
        {
          key: 'name',
          value: 'octank-poc-dev-env',
        },
      ],
    });
  }

  private get subnetId() {
    return [
      ...this.vpcStack.vpc.selectSubnets({
        subnetType: ec2.SubnetType.PRIVATE,
      }).subnetIds,
    ][0];
  }
}
