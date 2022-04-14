#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';

import { VpcStack } from '../lib/vpc-stack';
import { KafkaStack } from '../lib/kafka-stack';
import { S3BucketStack } from '../lib/s3-bucket-stack';
import { GlueStack } from '../lib/glue-stack';
import { Cloud9Stack } from '../lib/cloud9-stack';

const app = new cdk.App();
const vpcStack = new VpcStack(app, 'OctankPocVpcStack');
const cloud9Stack = new Cloud9Stack(vpcStack, app, 'OctankPocCloud9Stack');
const s3bucket = new S3BucketStack(app, 'OctankPocS3Stack');
const kafkaStack = new KafkaStack(vpcStack, app, 'OctankPocKafkaStack');
kafkaStack.addDependency(vpcStack);
const glueStack = new GlueStack(
  s3bucket,
  kafkaStack,
  app,
  'OctankPocGlueStack'
);
