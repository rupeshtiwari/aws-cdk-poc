import { aws_msk as msk, aws_ec2 as ec2, Stack, StackProps } from 'aws-cdk-lib';
import { VpcStack } from './vpc-stack';
import { Construct } from 'constructs';

export class KafkaStack extends Stack {
  public kafkaCluster: msk.CfnCluster;

  constructor(
    vpcStack: VpcStack,
    scope: Construct,
    id: string,
    props?: StackProps
  ) {
    super(scope, id, props);
    this.kafkaCluster = new msk.CfnCluster(this, 'kafkaCluster', {
      brokerNodeGroupInfo: {
        securityGroups: [vpcStack.kafkaSecurityGroup.securityGroupId],
        clientSubnets: [
          ...vpcStack.vpc.selectSubnets({
            subnetType: ec2.SubnetType.PRIVATE,
          }).subnetIds,
        ],
        instanceType: 'kafka.m5.8xlarge',
        storageInfo: {
          ebsStorageInfo: {
            volumeSize: 100,
          },
        },
      },
      clusterName: 'OctankKafkaCluster',
      kafkaVersion: '2.6.2',
      numberOfBrokerNodes: 20,
    });
  }
}