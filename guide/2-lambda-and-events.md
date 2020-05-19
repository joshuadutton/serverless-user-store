# 2 AWS Lambda

This is a chapter in the [Intro to Serverless](README.md) guide.

## Limitations
- binary files
- stateless (at least should be treated as such since since there is no guarantee you will run the same function instance more than once)
- time
- response sizes
- etc.

Further reading: https://docs.aws.amazon.com/lambda/latest/dg/gettingstarted-limits.html


### Call Lambda function directly

AWS SDKs and the CLI allow you to call a lambda function directly if you have permission to do so. When you 

Example: you could use the iOS mobile SDK to use a Lambda function to process a video file. 

> Note: I am not a big fan of the AWS mobile SDKs and prefer to use common abstractions like HTTPS and WebSockets to interact with Lambda functions.

### schedule

### API Gateway 

### API Gateway: http api

### API Gateway: websockets

### kinesis

### dynamodb

### s3

### sns

### sqs

### application load

### alexa skill

### alexa smarthome

### AWS IoT

### CloudWatch Event

### CloudWatch Log

### EventBridge Event

### CloudFront

### Cognito User Pool


