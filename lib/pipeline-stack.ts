import { Stack, StackProps } from 'aws-cdk-lib';
import {
  CodePipeline,
  CodePipelineSource,
  ManualApprovalStep,
  ShellStep,
  StageDeployment,
} from 'aws-cdk-lib/pipelines';
import { Construct } from 'constructs';
import { MyPipelineStage } from './stage';

export class PipelineStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    this.init();
  }

  private init() {
    const pipeline = this.createPipeline();

    // Add Test Stage
    const devStage = this.devStage(pipeline);

    // Add Approval Stage
    this.addManualApproval(devStage);

    // Add Prod Stage
    this.productionStage(pipeline);
  }

  private productionStage(pipeline: CodePipeline) {
    return pipeline.addStage(
      new MyPipelineStage(this, 'Production', {
        env: { account: '899252663854', region: 'us-east-1' },
      })
    );
  }

  private addManualApproval(devStage: StageDeployment) {
    return devStage.addPost(
      new ManualApprovalStep('Manual Approval Before Production Stage')
    );
  }

  private devStage(pipeline: CodePipeline) {
    return pipeline.addStage(
      new MyPipelineStage(this, 'Dev', {
        env: { account: '899252663854', region: 'us-east-1' },
      })
    );
  }

  private createPipeline() {
    return new CodePipeline(this, 'OctankPocPipeline', {
      pipelineName: 'OctankPocPipeline',
      synth: new ShellStep('Synth', {
        input: CodePipelineSource.gitHub('rupeshtiwari/aws-cdk-poc', 'main'),
        commands: ['npm ci', 'npm run build', 'npx cdk synth'],
      }),
    });
  }
}
