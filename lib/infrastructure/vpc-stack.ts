import { aws_ec2 as ec2, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';

export class VpcStack extends Stack {
  public vpc: ec2.Vpc;
  public kafkaSecurityGroup: ec2.SecurityGroup;
  public eventProducerSercurityGroup: ec2.SecurityGroup;
  public lambdaSecurityGroup: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    this.createVpc();

    this.createSecurityGroups();
  }

  private createVpc() {
    // default CIDR 10.0.128.0/18
    this.vpc = new ec2.Vpc(this, 'octankVPC', {
      gatewayEndpoints: {
        S3: {
          // Creating S3 gateway endpoint so that Glue can communicate to S3
          service: ec2.GatewayVpcEndpointAwsService.S3,
        },
      },
    });
  }

  private createSecurityGroups() {
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

  get subnetId() {
    return [
      ...this.vpc.selectSubnets({
        subnetType: ec2.SubnetType.PRIVATE,
      }).subnetIds,
    ][0];
  }
}
