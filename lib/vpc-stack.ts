import { Stack, aws_ec2 as ec2, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';

export class VpcStack extends Stack {
  public vpc: ec2.Vpc;
  public kafkaSecurityGroup: ec2.SecurityGroup;
  public eventProducerSercurityGroup: ec2.SecurityGroup;
  public lambdaSecurityGroup: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    this.vpc = new ec2.Vpc(this, 'octankVPC');

    this.kafkaSecurityGroup = new ec2.SecurityGroup(
      this,
      'octankKafkaSecurityGroup',
      {
        securityGroupName: 'octankKafkaSecurityGroup',
        vpc: this.vpc,
        allowAllOutbound: true,
      }
    );

    this.eventProducerSercurityGroup = new ec2.SecurityGroup(
      this,
      'eventProducerSecurityGroup',
      {
        securityGroupName: 'eventProducerSecurityGroup',
        vpc: this.vpc,
        allowAllOutbound: true,
      }
    );

    this.lambdaSecurityGroup = new ec2.SecurityGroup(
      this,
      'lambdaSecurityGroup',
      {
        securityGroupName: 'lambdaSecurityGroup',
        vpc: this.vpc,
        allowAllOutbound: true,
      }
    );

    this.kafkaSecurityGroup.connections.allowFrom(
      this.lambdaSecurityGroup,
      ec2.Port.allTraffic(),
      'allowFromLambdaToKafka'
    );
    this.kafkaSecurityGroup.connections.allowFrom(
      this.eventProducerSercurityGroup,
      ec2.Port.allTraffic(),
      'allowFromeventProducerToKafka'
    );
    this.eventProducerSercurityGroup.connections.allowFrom(
      this.kafkaSecurityGroup,
      ec2.Port.allTraffic(),
      'allowFromKafkaToeventProducer'
    );
  }
}
