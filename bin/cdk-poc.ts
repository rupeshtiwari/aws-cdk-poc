#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import 'source-map-support/register';
import { Cloud9Stack } from '../lib/infrastructure/cloud9-stack';
import { GlueStack } from '../lib/infrastructure/glue-stack';
import { KafkaStack } from '../lib/infrastructure/kafka-stack';
import { S3BucketStack } from '../lib/infrastructure/s3-bucket-stack';
import { VpcStack } from '../lib/infrastructure/vpc-stack';

const app = new cdk.App();
const vpcStack = new VpcStack(app, 'OctankPocVpcStack');
const cloud9Stack = new Cloud9Stack(vpcStack, app, 'OctankPocCloud9Stack');
cloud9Stack.addDependency(vpcStack);
const s3bucket = new S3BucketStack(app, 'OctankPocS3Stack');
const kafkaStack = new KafkaStack(vpcStack, app, 'OctankPocKafkaStack');
kafkaStack.addDependency(vpcStack);
const glueStack = new GlueStack(
  s3bucket,
  kafkaStack,
  app,
  'OctankPocGlueStack'
);
