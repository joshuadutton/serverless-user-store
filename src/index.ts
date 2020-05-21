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
