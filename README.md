# Infrastructure As Code using AWS CDK POC

Welcome to my workshop this is working code. It will create a `CI/CD` pipeline to deploy bunch of AWS resources in cloud. This is a POC to demonstrate I`nfrastructure As Code (IaC)` to deploy resources in AWS cloud using AWS CDK written in `typescript`.

## Architecture Diagram

![](assets/docs/architecture.png)

## Prerequisite 
1. AWS account 
2. Update `~/.aws/credential` file follow this file
{% gist 1cc9df1218b4d8c86c9232eeacd2b983" %}
## Getting Started

```
# clone the repo
git clone https://github.com/rupeshtiwari/aws-cdk-poc

# install node packages
npm ci

# build code 
npm run build

# create cloudformation template
cdk synth

# deploy cloudformation template (this will create a code pipeline to deploy bunch of stacks listed below)
cdk deploy

```
## Code pipeline

I am creating a code pipeline as well to trigger build and deploy as I check-in code to build CI/CD pipeline.

## Stacks Created

- **VPC** to create private cloud
- **Cloud9** for development and publishing events to `kafka`
- **Roles** one role for glue job
- **S3Bucket** buckets required for storing scripts and output files
- **Glue** to run Spark stream job
- **AWS MSK** to host broker for messaging framework built on `kafka`

## Welcome to your CDK TypeScript project

This is a blank project for TypeScript development with CDK.

The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Useful commands

- `npm run build` compile typescript to js
- `npm run watch` watch for changes and compile
- `npm run test` perform the jest unit tests
- `cdk deploy` deploy this stack to your default AWS account/region
- `cdk deploy --all` deploy all stacks to your default AWS account/region
- `cdk diff` compare deployed stack with current state
- `cdk synth` emits the synthesized CloudFormation template
- `cdk destroy` delete stack

## References

- `git pull && git add . && git commit -m 'updates' && git push`

- https://medium.com/@kargawal.abhishek/aws-cdk-deploy-managed-etl-using-aws-glue-job-1925098ec40f

- https://datachef.co/blog/deploy-pythonshell-gluejob-using-cdk/
- [Glue CDK Args](https://docs.aws.amazon.com/glue/latest/dg/aws-glue-programming-etl-glue-arguments.html)
- [CI/CD AWS CDK Demo](https://github.com/rupeshtiwari/ci-cd-aws-pipeline-demo-cdk)
