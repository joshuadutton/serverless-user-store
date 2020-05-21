import { ApiGatewayManagementApi, AWSError } from 'aws-sdk';
import { Context } from 'aws-lambda';
import * as log from './log';
import SubscriptionHandler, { WebSocketSubscriber } from './SubscriptionHandler';
import Auth from './Auth';

export interface ApiGatewayWebSocketEvent {
  requestContext: {
    routeKey: string;
    connectionId: string;
    messageId?: string;
    eventType: string;
    extendedRequestId: string;
    requestTime: string;
    messageDirection: string;
    connectedAt: number;
    requestTimeEpoch: number;
    requestId: string;
    domainName: string;
    stage: string;
    apiId: string;
    identity: { [key: string]: any };
  };
  headers?: { [key: string]: any };
  isBase64Encoded: boolean;
}

function errorWrapper(error: AWSError, action: string, endpoint: string): Promise<any> {
  // AWS doesn't namespace errors
  error.code = `ApiGatewayManagementApi:${error.code}`;
  error.message = `ApiGatewayManagementApi:${action}:${endpoint} ${error.message}`;
  return Promise.reject(error);
}

export interface ApiGatewayWebSocketResult {
  statusCode: number;
}

export async function sendMessage(connectionId: string, endpoint: string, message: any): Promise<any> {
  const apiGateway = new ApiGatewayManagementApi({ endpoint, apiVersion: '2029' });

  return apiGateway.postToConnection({
    ConnectionId: connectionId,
    Data: message,
  }).promise()
  .catch(error => errorWrapper(error, 'postToConnection', endpoint));
}

export default class ApiGatewayWebSockets {
  region: string;
  subscriptionHandler: SubscriptionHandler;
  auth: Auth;

  constructor(region: string, subscriptionHandler: SubscriptionHandler, auth: Auth) {
    this.region = region;
    this.subscriptionHandler = subscriptionHandler;
    this.auth = auth;
  }

  async handler(event: ApiGatewayWebSocketEvent, context: Context): Promise<ApiGatewayWebSocketResult> {
    const connectionId = event.requestContext.connectionId;
    const routeKey = event.requestContext.routeKey;
    const domain = event.requestContext.domainName;
    const stage = event.requestContext.stage;
    const headers: any = event.headers;

    let endpoint = `https://${domain}`;
    if (domain === 'localhost') {
      endpoint = 'http://localhost:3001';
    } else if (domain.includes('amazonaws.com')) {
      endpoint = `https://${domain}/${stage}`;
    }
  
    

    try {
      const userId = await this.auth.authorizeBearerToken(headers['Authorization'], ['self']);
      log.logApiGatewayWebsocket(routeKey, endpoint, connectionId, userId)
      switch (routeKey) {
        case '$connect': {
          const subscriber = new WebSocketSubscriber(connectionId, endpoint);
          await this.subscriptionHandler.subscribe(userId, subscriber);
          break;
        }
        case '$disconnect':
          await this.subscriptionHandler.unsubscribe(connectionId);
          break;
        case '$default':
          throw new Error(`incoming messages not supported`);
      }
    } catch (error) {
      error.statusCode = error.statusCode || 500;
      log.error(error);
      await sendMessage(connectionId, endpoint, `${error}`);
    }
    return { statusCode: 200 };
  }
}
