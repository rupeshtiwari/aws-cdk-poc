#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';

import { VpcStack } from '../lib/vpc-stack';
import { KafkaStack } from '../lib/kafka-stack';
import { S3BucketStack } from '../lib/s3-bucket-stack';
import { GlueStack } from '../lib/glue-stack';

const app = new cdk.App();

const s3bucket = new S3BucketStack(app, 'S3Stack');

const vpcStack = new VpcStack(app, 'VpcStack');

const kafkaStack = new KafkaStack(vpcStack, app, 'KafkaStack');
kafkaStack.addDependency(vpcStack);

const glueStack = new GlueStack(s3bucket, kafkaStack, app, 'GlueStack');
