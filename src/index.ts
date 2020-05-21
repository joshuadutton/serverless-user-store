import 'source-map-support/register'
import { APIGatewayProxyEvent, Context } from 'aws-lambda';

import { ApiGatewayWebSocketEvent } from './lib/ApiGatewayWebSockets'
import ApiGatewayWebSocketSubscriptions from './lib/ApiGatewayWebSocketSubscriptions';
import * as log from './lib/log';
import ApiGatewayExpress from './lib/ApiGatewayExpress';
import UserRouter from './UserRouter';
import SubscriptionHandler from './lib/SubscriptionHandler';
import { getEnvVar } from './lib/ObjectStore';
import BaseRouter from './BaseRouter';
import Auth from './lib/Auth';

const region = getEnvVar('REGION');
const auth = new Auth(region, getEnvVar('PASSWORD_TABLE'));
const subscriptionHandler = new SubscriptionHandler(region, getEnvVar('SUBSCRIPTION_TABLE'));
const userRouter = new UserRouter(subscriptionHandler);
const baseRouter = new BaseRouter(userRouter.store, auth);

const apiGatewayExpressUser = new ApiGatewayExpress({ "(/dev)?/api/user": userRouter.router });
const apiGatewayExpressBase = new ApiGatewayExpress({ "(/dev)?/": baseRouter.router });
const apiGatewayWebSocketSubscriptions = new ApiGatewayWebSocketSubscriptions(subscriptionHandler, auth);

export function httpApiHandler(event: APIGatewayProxyEvent, context: Context) {
  log.logApiGatewayEvent(event, { onlyWhenDebug: true });
  apiGatewayExpressUser.handler(event, context);
}

export function httpHandler(event: APIGatewayProxyEvent, context: Context) {
  log.logApiGatewayEvent(event, { onlyWhenDebug: true });
  apiGatewayExpressBase.handler(event, context);
}

export async function authorizerHandler(event: any, context: Context) {
  log.logApiGatewayEvent(event, { onlyWhenDebug: true });
  return baseRouter.auth.authHandler(event, context, ['self']);
}

export async function webSocketsHandler(event: ApiGatewayWebSocketEvent, context: Context) {
  log.logApiGatewayEvent(event, { onlyWhenDebug: true });
  return apiGatewayWebSocketSubscriptions.handler(event, context);
}
