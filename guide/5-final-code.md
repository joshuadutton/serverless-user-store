# 5 Final code

This is a chapter in the [Intro to Serverless](README.md) guide.

## Our Lambda functions

serverless.yml
```yaml
...
functions:
  authorizerFunction: # custom authorizer. Run as a separate Lambda function 
    handler: src/index.authorizerHandler
  httpApiHandler:
    handler: src/index.httpApiHandler
    events:
      - http:
          path: api/
          method: ANY # gets called for GET, POST, PUT, DELETE, etc
          authorizer:
            name: authorizerFunction
            resultTtlInSeconds: 3200 # caches the authorization for 1 hour
      - http:
          path: "api/{proxy+}" # catch-all path (e.g. api/any/path/). This works because we use Express for routing
          method: ANY
          authorizer:
            name: authorizerFunction
            resultTtlInSeconds: 3200
  httpHandler:
    handler: src/index.httpHandler
    events:
      - http:
          path: /
          method: ANY
      - http:
          path: "{proxy+}" # catch-all path for anything not /api (e.g. any/path/will/be/handled)
          method: ANY
  webSocketsHandler:
    handler: src/index.webSocketsHandler
    events: 
      - websocket: $connect # I prefer to use the same handler for all websocket events (I just use a switch statement in my handler)
      - websocket: $disconnect
      - websocket: $default
...
```

index.ts
```TypeScript
import 'source-map-support/register'
import { APIGatewayProxyEvent, Context } from 'aws-lambda';

import { ApiGatewayWebSocketEvent, ApiGatewayWebSocketResult } from './lib/ApiGatewayWebSockets'
import ApiGatewayWebSocketSubscriptions from './lib/ApiGatewayWebSocketSubscriptions';
import * as log from './lib/log';
import ApiGatewayExpress from './lib/ApiGatewayExpress';
import ApiRouter from './ApiRouter';
import SubscriptionHandler from './lib/SubscriptionHandler';
import { getEnvVar } from './lib/ObjectStore';
import BaseRouter from './BaseRouter';
import Auth, { IamPolicy } from './lib/Auth';

const region = getEnvVar('REGION');
const auth = new Auth(region, getEnvVar('PASSWORD_TABLE'));
const subscriptionHandler = new SubscriptionHandler(region, getEnvVar('SUBSCRIPTION_TABLE'));
const apiRouter = new ApiRouter(subscriptionHandler);
const baseRouter = new BaseRouter(apiRouter.store, auth);

const apiGatewayExpressApi = new ApiGatewayExpress({ "(/dev)?/api": apiRouter.router });
const apiGatewayExpressBase = new ApiGatewayExpress({ "(/dev)?/": baseRouter.router });
const apiGatewayWebSocketSubscriptions = new ApiGatewayWebSocketSubscriptions(subscriptionHandler, auth);

export function httpApiHandler(event: APIGatewayProxyEvent, context: Context): void {
  // doesn't use async or callback because aws-serverless-express uses context
  log.logApiGatewayEvent(event, { onlyWhenDebug: true });
  apiGatewayExpressApi.handler(event, context);
}

export function httpHandler(event: APIGatewayProxyEvent, context: Context): void {
  // doesn't use async or callback because aws-serverless-express uses context
  log.logApiGatewayEvent(event, { onlyWhenDebug: true });
  apiGatewayExpressBase.handler(event, context);
}

export async function authorizerHandler(event: any, context: Context): Promise<IamPolicy> {
  log.logApiGatewayEvent(event, { onlyWhenDebug: true });
  return await baseRouter.auth.authHandler(event, context, ['self']);
}

export async function webSocketsHandler(event: ApiGatewayWebSocketEvent, context: Context): Promise<ApiGatewayWebSocketResult> {
  log.logApiGatewayEvent(event, { onlyWhenDebug: true });
  return apiGatewayWebSocketSubscriptions.handler(event, context);
}
```

## Using the Express router

Express is a very popular Node.js framework. Instead of being a full MVC framework, it's just routing and middleware. I use in my Serverless apps for a few reasons:

1. It is well documented and understood
2. I don't have to tie myself to API gateway event syntax. In fact, other services like Google and Azure cloud functions adopt the more widely used Express request and response syntax. 
3. I can easily run my code elsewhere like a Docker container
4. I avoid the CloudFormation max resource limitation that can arise if you use a lot of routes and handlers within API Gateway

Further reading:
- Express routing: https://expressjs.com/en/guide/routing.html
- AWS Serverless Express: https://github.com/awslabs/aws-serverless-express


## Authentication

I put our authentication in an API Gateway authorizer lambda function. Now, I could have handled authorization as Express middleware, but I like this method because API Gateway will only trigger your application code if the user is authorized and it can be configured to cache the result. This helps in particular if you use 3rd party authorization tools that have their own costs and rate limits. 

Further reading:
- https://www.serverless.com/framework/docs/providers/aws/events/apigateway/#http-endpoints-with-custom-authorizers

## Websockets

I added WebSockets to give you an example of some of the asynchronous event patterns that Lambda supports.

## Final architecture:

#### API endpoints with authorizer:

```
               ┌──────────────┐     ┌─────────────┐          ┌─────────────┐
               │              │     │             │          │             │
               │     API      │     │      λ      │          │  DynamoDB   │
◀────HTTPS────▶│   Gateway    │◀───▶│ Authorizer  │ ◀───────▶│  Passwords  │
               │              │     │             │          │             │
               │              │     │             │          │             │
               └──────────────┘     └─────────────┘          └─────────────┘
                       ▲                                     ┌─────────────┐
                       └───────────────────┐                 │             │
                                           ▼                 │  DynamoDB   │
               ┌──────────────┐     ┌─────────────┐    ┌────▶│Subscriptions│
               │              │     │             │    │     │             │
               │ API Gateway  │     │      λ      │    │     │             │
◀───WSS────────│WebSocket API │◀────│   Lambda    │◀───┤     └─────────────┘
               │              │     │             │    │     ┌─────────────┐
               │              │     │             │    │     │             │
               └──────────────┘     └─────────────┘    │     │  DynamoDB   │
                                           │           ├────▶│    Users    │
                                           ▼           │     │             │
                                    ┌─────────────┐    │     │             │
       Includes all                 │             │    │     └─────────────┘
        IAM access                  │ CloudWatch  │    │     ┌─────────────┐
       permissions                  │    Logs     │    │     │             │
                                    │             │    │     │             │
                                    │             │    └────▶│  S3 Users   │
                                    └─────────────┘          │             │
                                                             │             │
                                                             └─────────────┘
```

#### Other endpoints (user registration and login)

```
               ┌──────────────┐     ┌─────────────┐        ┌─────────────┐
               │              │     │             │        │             │
               │     API      │     │      λ      │        │  DynamoDB   │
◀────HTTPS────▶│   Gateway    │◀───▶│   Lambda    │◀──────▶│  Passwords  │
               │              │     │             │        │             │
               │              │     │             │        │             │
               └──────────────┘     └─────────────┘        └─────────────┘
                                           │                              
                                           │                              
                                           ▼                              
                                    ┌─────────────┐                       
         Includes all               │             │                       
          IAM access                │ CloudWatch  │                       
         permissions                │    Logs     │                       
                                    │             │                       
                                    │             │                       
                                    └─────────────┘                       
```

#### WebSockets

Note that a different Lambda function handles the WebSocket connect then the one that sends WebSocket messages on a user change

```
               ┌──────────────┐     ┌─────────────┐        ┌─────────────┐
               │              │     │             │        │             │
               │     API      │     │      λ      │        │  DynamoDB   │
◀─────WSS─────▶│   Gateway    │◀───▶│   Lambda    │◀──────▶│Subscriptions│
               │              │     │             │        │             │
               │              │     │             │        │             │
               └──────────────┘     └─────────────┘        └─────────────┘
                                           │                              
                                           │                              
                                           ▼                              
                                    ┌─────────────┐                       
         Includes all               │             │                       
          IAM access                │ CloudWatch  │                       
         permissions                │    Logs     │                       
                                    │             │                       
                                    │             │                       
                                    └─────────────┘                       
```

Further reading:
- The code in this repo! I have put together some very focused helper classes and functions that are composable. It is my intention for this code to be easily understood and reused for your own purposes. 
