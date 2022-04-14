import { aws_iam as iam, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';

export class RoleStack extends Stack {
  glueRole: iam.Role;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
    this.glueRole = this.createGlueRole();
  }

  private createGlueRole() {
    // Create a new Role for Glue
    const role = new iam.Role(this, 'access-glue-poc', {
      assumedBy: new iam.ServicePrincipal('glue.amazonaws.com'),
    });

    // Add AWSGlueServiceRole to role.
    const gluePolicy = iam.ManagedPolicy.fromAwsManagedPolicyName(
      'service-role/AWSGlueServiceRole'
    );
    role.addManagedPolicy(gluePolicy);

    return role;
  }
}
