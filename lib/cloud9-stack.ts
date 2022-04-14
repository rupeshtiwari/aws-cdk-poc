import {
  aws_msk as msk,
  aws_ec2 as ec2,
  Stack,
  StackProps,
  aws_cloud9 as cloud9,
  aws_codecommit as codecommit,
} from 'aws-cdk-lib';
import { VpcStack } from './vpc-stack';
import { Construct } from 'constructs';
import { CfnEnvironmentEC2Props } from 'aws-cdk-lib/aws-cloud9';

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
    const vpc = this.vpcStack.vpc;
    const c9env = new cloud9.CfnEnvironmentEC2(this, 'OctankPocEnv', {
      name: 'OctankPocEnv',
      instanceType: 'm5.large',
      automaticStopTimeMinutes: 360,
      description:
        'cloud9 environment for Octank to publish events on kafka topic',
      subnetId: vpc.isolatedSubnets[0].subnetId,
    
      tags: [
        {
          key: 'name',
          value: 'octank-poc-dev-env',
        },
      ],
    });
      
  }
}
