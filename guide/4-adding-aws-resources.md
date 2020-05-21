# 4 Adding AWS resources

This is a chapter in the [Intro to Serverless](README.md) guide.

We need a place to store data. The Serverless Framework is built around Lambda functions and Triggers, but not other AWS resources, so they don't have helper syntax to create those other things. I feel like this is a great thing because it keeps the Serverless Framework focused and easy-to-use. Luckily, Serverless also makes it easy to add arbitrary AWS CloudFormation templates.

## Adding variables to our serverless.yml file

Let's update our file to include:

```yaml
custom:
  defaultStage: dev
  userTable: 'serverless-user-store-${self:provider.stage}-user'
  userBucket: 'serverless-user-store-${self:provider.stage}-user-unique' # needs a globally unique name

provider:
  name: aws
  runtime: nodejs12.x
  stage: ${opt:stage, self:custom.defaultStage}
  ...
```

`userTable` and `userBucket` are dynamically generated so we have different resources for each stage, and we can access the same value in multiple places. 

Further reading:
- https://www.serverless.com/framework/docs/providers/aws/guide/variables/

## Adding a DynamoDB table:

```yaml
resources: # serverless framework key for resources
  Resources: # CloudFormation key for resources
    UserTable: # arbitrary name for referencing this resource elsewhere if needed
      Type: AWS::DynamoDB::Table # AWS resource type
      Properties:
        TableName: ${self:custom.userTable}
        AttributeDefinitions: # only key attributes are required in definition. Other attributes can be added dynamically. 
          - AttributeName: id 
            AttributeType: S
        KeySchema:
          - AttributeName: id # DynamoDB supports 1 part and 2-part keys. See further reading below
            KeyType: HASH
        BillingMode: PAY_PER_REQUEST # This isn't just for billing. This also turns on auto-scaling so there is zero scaling configuration
```

Further reading:
- https://www.serverless.com/dynamodb/
- Serverless database considerations: https://www.serverless.com/blog/choosing-a-database-with-serverless/
- https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Introduction.html
- DynamoDB Best Practices: https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/best-practices.html
- Automated Backups: https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/PointInTimeRecovery.html 

### Adding an S3 bucket:

```yaml
resources:
  Resources:
    ...
    UserBucket:
      Type: AWS::S3::Bucket
      Properties: 
        BucketName: ${self:custom.userBucket} # must be globally unique
```

Further reading:
- https://docs.aws.amazon.com/AmazonS3/latest/dev/Welcome.html
- Using Versioning: https://docs.aws.amazon.com/AmazonS3/latest/dev/Versioning.html

## Giving your Lambda function permissions to AWS resources

We've created a DynamoDB table and a S3 bucket, but our Lambda function can't access them yet because it doesn't have permission to do so! AWS has a very powerful, fine-grained permissions system called IAM (Identity & Access Management). 

Add this in the `provider` section of serverless.yml:

```yaml
provider:
  name: aws
  ...
  iamRoleStatements:
    - Effect: Allow
      Action:
        - dynamodb:GetItem
        - dynamodb:PutItem
        - dynamodb:DeleteItem
      Resource:
        - 'arn:aws:dynamodb:*:*:table/${self:custom.userTable}'
    - Effect: Allow
      Action:
        - s3:ListBucket
        - s3:PutObject
        - s3:GetObject
        - s3:DeleteObject
      Resource:
        - 'arn:aws:s3:::${self:custom.userBucket}'
        - 'arn:aws:s3:::${self:custom.userBucket}/*'
```

Further reading:
- https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies.html
- DynamoDB IAM policies: https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/using-identity-based-policies.html
- S3 IAM policies: https://docs.aws.amazon.com/AmazonS3/latest/dev/using-iam-policies.html

## Using the AWS SDK to access resources in your code

Let's add the SDK to our project. Note: we only have to add it as a dev dependencies because all AWS provided Lambda runtimes include the SDK, so there is no reason to bloat our deployed code.

```bash
yarn add --dev aws-sdk
```

The Node SDK is documented here: https://aws.amazon.com/sdk-for-node-js/. It has TypeScript definitions and the option to use traditional callbacks or promises (just add `.promise()` to the end of an async api call).

Example of accessing DynamoDB:

```TypeScript
import { DynamoDB } from "aws-sdk";

// DocumentClient returns simple JSON objects instead of the complex DynamoDB objects that include their own flavor of type definitions
// (example of complex version: https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB.html#getItem-property)
const db = new DynamoDB.DocumentClient({ region: 'us-east-1' });
const user = await db.get({
  TableName: this.tableName, 
  Key: { id: 'test-user' },
  ConsistentRead: true
}).promise()
.then(result => {
  return result.Item;
});
```

Example of accessing S3:

```TypeScript
import { S3 } from 'aws-sdk';

const s3 = new S3();
const user = await s3.getObject({
  Bucket: 'user-bucket',
  Key: 'user/test-user.json',
}).promise()
.then(object => {
  if (object.Body) {
    return JSON.parse(object.Body.toString('utf8'));
  }
});
```

Further reading:

