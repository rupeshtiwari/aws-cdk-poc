import {
  aws_glue as glue,
  aws_iam as iam,
  aws_s3 as s3,
  Stack,
  StackProps,
  aws_ec2 as ec2,
} from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { KafkaStack } from './kafka-stack';
import { RoleStack } from './role-stack';
import { S3BucketStack } from './s3-bucket-stack';
import { VpcStack } from './vpc-stack';

//This value must be glueetl for Apache Spark
const COMMAND_NAME = 'glueetl';
const SPARKAVRO_PATH = 'jars/spark-avro_2.12-3.1.2.jar';

const GLUE_VERSION = '3.0';

export class GlueStack extends Stack {
  constructor(
    private vpcStack: VpcStack,
    private s3Stack: S3BucketStack,
    private kafkaStack: KafkaStack,
    roleStack: RoleStack,
    scope: Construct,
    id: string,
    props?: StackProps
  ) {
    super(scope, id, props);
    this.createGlueJob(s3Stack.bucket, roleStack.glueRole);
  }

  private createGlueJob(bucket: s3.Bucket, role: iam.Role) {
    const bucketName = bucket.bucketName;
    const streamKafkaEventJobName = 'stream-kafka-events';
    const streamKafkaEventJob = new glue.CfnJob(this, streamKafkaEventJobName, {
      name: streamKafkaEventJobName,
      role: role.roleArn,
      description: 'Octank Security Data Platform Job',
      command: {
        name: COMMAND_NAME,
        scriptLocation: `s3://${bucketName}/assets/spark/streaming.scala`,
      },
      glueVersion: GLUE_VERSION,
      defaultArguments: {
        '--extra-jars': `s3://${bucketName}/assets/${SPARKAVRO_PATH}`,
        '--executor-cores': 8,
        '--enable-metrics': true,
        '--enable-continuous-cloudwatch-log': true,
        '--enable-spark-ui': true,
        '-enable-auto-scaling': true,
        '--job-language': 'scala',
        // '--brokers': this.kafkaStack.kafkaCluster, // No way to pass bootstrap broker url https://github.com/aws/aws-cdk/issues/7904
        '--topic': 'netflow20',
        '--bucket_name': this.s3Stack.bucket.bucketName,
      },
      // Please set both Worker Type and Number of Workers.
      numberOfWorkers: 30,
      workerType: 'G.1X',
      connections: {
        connections: [this.kafkaConnection.logicalId],
      },
    });
  }

  /**
   * Connection to kafka to receive messgaes in Glue job
   */
  private get kafkaConnection() {
    return new glue.CfnConnection(this, 'OctankPocKafkaConnector', {
      catalogId: '!Ref AWS::AccountId',
      connectionInput: {
        connectionType: 'KAFKA',
        name: 'KafkaConnector',
        description: 'Connection to receive messages from Kafka Cluster',

        physicalConnectionRequirements: {
          subnetId: this.vpcStack.subnetId,
          securityGroupIdList: [
            this.vpcStack.kafkaSecurityGroup.securityGroupId,
          ],
          availabilityZone: this.vpcStack.availabilityZones[0],
        },
      },
    });
  }
}
