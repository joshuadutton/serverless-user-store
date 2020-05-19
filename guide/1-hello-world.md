# 1 Hello World

This is a chapter in the [Intro to Serverless](README.md) guide.

## serverless.yml

Lambda functions can be configured in a lot of different ways. Serverless Framework simplifies this with a yaml configuration file. It is basically a shorthand for AWS CloudFormation, a templating system to deploy and configure AWS resources. As we will see, a simple serverless.yml file ends up doing quite a bit. 

```yaml
service: hello-world # name that's unique to your AWS account

provider:
  name: aws # Serverless Framework supports other providers too. See https://www.serverless.com/framework/docs/providers/
  runtime: nodejs12.x # See https://docs.aws.amazon.com/lambda/latest/dg/lambda-runtimes.html
  stage: dev # Set the default stage used. Default is dev
  memorySize: 512 # Default is 1024. See https://aws.amazon.com/lambda/pricing/
  timeout: 30 # Default is 3 seconds. 30 seconds is the maximum for API Gateway. Maximum for Lambda is 900 seconds. See https://docs.aws.amazon.com/lambda/latest/dg/configuration-console.html

functions: # Your Lambda functions
  helloWord:  # Function name
    handler: index.helloWorld # Reference to file index.js & exported function 'helloWorld'
    events:   # The "Events" that trigger this function
      - http: get hello-world # API Gateway event that maps to a GET request at the endpoint /hello-world (shorthand version)

resources: # The "Resources" your Lambda functions use.  Raw AWS CloudFormation goes in here.
```

Further reading:
- [Serverless Framework Services Guide](https://www.serverless.com/framework/docs/providers/aws/guide/services/)
- [Serverless Framework Function Guide](https://www.serverless.com/framework/docs/providers/aws/guide/functions/)

> Note: Why Serverless Framework? AWS is awesome and powerful. It continues to lead the way in cloud providers and supports the infrastructure for a large percentage of the internet. But with that power comes a lot of features and configuration. AWS is complicated and has a high learning curve. Even though it has good documentation, there is a lot of it, and it is often hard to find what you are looking for in the place you expect. Serverless Framework simplifies a lot of that complexity. I feel it's important to understand the basics of what's going on under the hood, but I am very grateful to not have to deal with all the details of many common tasks. AWS has also tried to address this issue themselves with tools like SAM and AppSync, but I haven't found either as easy to use and as understandable as Serverless Framework.

## index.js

```JavaScript
module.exports.helloWorld = async function(event, context) {
  // see example event object here: https://www.serverless.com/framework/docs/providers/aws/events/apigateway#example-lambda-proxy-event-default
  console.log(JSON.stringify(event)); // logs to CloudWatch

  const name = event.queryStringParameters && event.queryStringParameters.name || 'unidentified user';
  
  const responseBody = {
    message: `hello ${name}!`
  };

  const response = {
    statusCode: 200,
    headers: {
        "x-custom-header" : "my custom header value" // Content-Type: application/json is the default Content-Type so is added if none is specified
    },
    body: JSON.stringify(responseBody)  // body must always be a string and should match Content-Type (mime type)
  };
  return response
}
```

## Deploy

In your console go to `<project_root>/guide/examples/2-hello-world` and type:

```bash
serverless deploy
```


## Deployment diagram

```
               ┌──────────────┐     ┌─────────────┐
               │              │     │             │
               │     API      │     │      λ      │
◀────HTTPS────▶│   Gateway    │◀───▶│   Lambda    │
               │              │     │             │
               │              │     │             │
               └──────────────┘     └─────────────┘
                                           │       
                                           ▼       
                                    ┌─────────────┐
            Includes all            │             │
             IAM access             │ CloudWatch  │
            permissions             │    Logs     │
                                    │             │
                                    │             │
                                    └─────────────┘
```

## Generated CloudFormation template

View an example of the generated template [here](examples/2-hello-world/cloudformation-template-update-stack.json)
