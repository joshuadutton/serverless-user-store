
import 'source-map-support/register'
import { APIGatewayProxyEvent, Context } from 'aws-lambda';

import ApiGatewayWebSockets, { ApiGatewayWebSocketEvent } from './lib/ApiGatewayWebSockets';
import * as log from './lib/log';
import ApiGatewayExpress from './lib/ApiGatewayExpress';
import UserRouter from './UserRouter';
import SubscriptionHandler from './lib/SubscriptionHandler';
import { getEnvVar } from './lib/DataStore';

const region = getEnvVar('REGION');
const subscriptionHandler = new SubscriptionHandler(region, getEnvVar('SUBSCRIPTION_TABLE'));
const userRouter = new UserRouter(subscriptionHandler);
const routerMap = { "(/dev)?/user": userRouter.router };

const apiGatewayExpress = new ApiGatewayExpress(routerMap);
const apiGatewayWebSockets = new ApiGatewayWebSockets(region, subscriptionHandler);

export function httpHandler(event: APIGatewayProxyEvent, context: Context) {
  log.logApiGatewayEvent(event, { onlyWhenDebug: true });
  apiGatewayExpress.handler(event, context);
}

export async function webSocketsHandler(event: ApiGatewayWebSocketEvent, context: Context) {
  log.logApiGatewayEvent(event, { onlyWhenDebug: true });
  return apiGatewayWebSockets.handler(event, context);
}
