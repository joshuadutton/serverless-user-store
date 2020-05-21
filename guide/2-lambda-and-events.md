# 2 AWS Lambda

This is a chapter in the [Intro to Serverless](README.md) guide.

## Limitations
- binary files
- stateless (at least should be treated as such since since there is no guarantee you will run the same function instance more than once)
- time
- response sizes
- etc.

Further reading: https://docs.aws.amazon.com/lambda/latest/dg/gettingstarted-limits.html

## Ways to interact with Lambda and event triggers:


### Call Lambda function directly

AWS SDKs and the CLI allow you to call a lambda function directly if you have permission to do so. 

Example: you could use the iOS mobile SDK to use a Lambda function to process a video file. 

Further reading:
- Node SDK: https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/Lambda.html#invoke-property
- iOS SDK: https://aws-amplify.github.io/aws-sdk-ios/docs/reference/AWSLambda/index.html
- Android SDK: https://aws-amplify.github.io/aws-sdk-android/docs/reference/index.html (doesn't create urls for specific section of docs, so search for `AWSLambdaClient`)

> Note: I am not a big fan of the AWS mobile SDKs and prefer to use common abstractions like HTTPS and WebSockets to interact with Lambda functions.

### schedule

Like a cron job (even support cron syntax). Good for running scheduled jobs.

Further reading:
- https://www.serverless.com/framework/docs/providers/aws/events/schedule/
- https://docs.aws.amazon.com/AmazonCloudWatch/latest/events/RunLambdaSchedule.html

### API Gateway: REST API

What we are doing here! Connect HTTP endpoints to functions. 

Further reading:
- https://www.serverless.com/framework/docs/providers/aws/events/apigateway/
- https://aws.amazon.com/api-gateway/
- https://docs.aws.amazon.com/apigateway/latest/developerguide/welcome.html

### API Gateway: HTTP API

This is like the REST API but is optimized for some specific use cases. Comparison here:

https://docs.aws.amazon.com/apigateway/latest/developerguide/http-api-vs-rest.html

Further reading:
- https://www.serverless.com/framework/docs/providers/aws/events/http-api/

### API Gateway: WebSockets

Fully managed, auto-scaling WebSockets. API Gateway will persist the connection while only calling your Lambda function when needed. This means that in many cases, connection state needs to be stored somewhere in you application code so you can send messages to pre-established connections from a state-less Lambda function. This is done in this repo using DynamoDB.

Further reading:
- https://www.serverless.com/framework/docs/providers/aws/events/websocket/
- https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-websocket-api.html

### Kinesis

Kinesis is an event stream. Used for batching large events from a large stream like real-time video, Twitter feeds (even the full Twitter firehose), IoT sensors and more. Lambda can be configured to process these events in batches.

Further reading:
- https://www.serverless.com/framework/docs/providers/aws/events/streams/
- https://aws.amazon.com/kinesis/

### DynamoDB

Trigger a Lambda function when a DynamoDB table is modified (e.g. a new entry is added).

Further reading:
- https://www.serverless.com/framework/docs/providers/aws/events/streams/
- https://aws.amazon.com/dynamodb/

### S3 (Simple Storage Service)

Trigger a Lambda function when a S3 bucket is modified (e.g. a new entry is added).

Further reading:
- https://www.serverless.com/framework/docs/providers/aws/events/s3/
- https://aws.amazon.com/s3/

### SNS (Simple Notification Service)

Trigger a Lambda function when a message is published to a given topic. Also supports filtering rules. 

Further reading:
- https://www.serverless.com/framework/docs/providers/aws/events/sns/
- https://aws.amazon.com/sns/

### SQS (Simple Queue Service)

Trigger a Lambda function when a message is added to a given queue. 

Further reading:
- https://www.serverless.com/framework/docs/providers/aws/events/sqs/
- https://aws.amazon.com/sqs/

### Application Load Balancer

Trigger a Lambda function when certain traffic patterns are met.

Further reading:
- https://www.serverless.com/framework/docs/providers/aws/events/alb/

### Alexa Skill

Trigger a Lambda function to respond to an Alexa Skill invocation.

Further reading:
- https://www.serverless.com/framework/docs/providers/aws/events/alexa-skill/
- https://developer.amazon.com/en-US/alexa
- https://developer.amazon.com/en-US/alexa/alexa-skills-kit/get-deeper/tutorials-code-samples

### Alexa Smarthome

Trigger a Lambda function to respond to an Alexa Smarthome Skill invocation.

Further reading:
- https://www.serverless.com/framework/docs/providers/aws/events/alexa-smart-home/
- https://developer.amazon.com/en-US/alexa/devices/smart-home-devices

### AWS IoT (Internet of Things)

Trigger a Lambda function when a message is published to a given topic. Also supports filtering rules. 

Further reading:
- https://www.serverless.com/framework/docs/providers/aws/events/iot/
- https://aws.amazon.com/iot/

### CloudWatch Event

Cloudwatch allows you to setup alarms for most AWS services based on a wide range of criteria. A Lambda function can be triggered when an alarm goes off. This is one way to add your own auto-triggered logic for scaling, logging, and notifications. 

Further reading:
- https://www.serverless.com/framework/docs/providers/aws/events/cloudwatch-event/
- https://aws.amazon.com/cloudwatch/

### CloudWatch Log

Trigger a Lambda function when a new log entry is added to a log stream.

Further Reading:
- https://www.serverless.com/framework/docs/providers/aws/events/cloudwatch-log/

### EventBridge Event

The EventBridge makes it possible to connect applications using data from external sources (e.g. own applications, SaaS like Zendesk and Datadog) or AWS services. 

Further Reading:
- https://www.serverless.com/framework/docs/providers/aws/events/event-bridge/
- https://aws.amazon.com/eventbridge/

### CloudFront

Amazon CloudFront is a content delivery network (CDN) service that allows Lambda functions to be executed at edge locations.

Further reading:
- https://www.serverless.com/framework/docs/providers/aws/events/cloudfront/
- https://aws.amazon.com/cloudfront/

### Cognito User Pool

Trigger a Lambda function from authentication and user signup events. 

Further reading:
- https://www.serverless.com/framework/docs/providers/aws/events/cognito-user-pool/
- https://aws.amazon.com/cognito/


