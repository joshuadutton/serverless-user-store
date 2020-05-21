import { Context } from 'aws-lambda';

import * as log from './log';
import SubscriptionHandler, { WebSocketSubscriber } from './SubscriptionHandler';
import Auth from './Auth';
import { ApiGatewayWebSocketEvent, ApiGatewayWebSocketResult, sendMessage } from './ApiGatewayWebSockets';

export default class ApiGatewayWebSocketSubscriptions {
  subscriptionHandler: SubscriptionHandler;
  auth: Auth;

  constructor(subscriptionHandler: SubscriptionHandler, auth: Auth) {
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
