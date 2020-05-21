import { Router, NextFunction, Request, Response } from 'express';

interface RequestWithAuth extends Request {
  auth: { 
    user: {
      id: string;
    }
  }
}

import SubscriptionHandler from './lib/SubscriptionHandler';
import ObjectStore, { getEnvVar } from './lib/ObjectStore';
import User, { rootReducer } from './User';
import S3Store from './lib/S3ObjectStore';
import DynamoDBStore from './lib/DynamoDBObjectStore';


export default class UserRouter {
  readonly store: ObjectStore<User>;
  readonly router = Router();
  readonly subscriptionHandler: SubscriptionHandler;

  constructor(subscriptionHandler: SubscriptionHandler) {
    const type = getEnvVar('STORE_TYPE');
    if (type === 'S3') {
      this.store = new S3Store<User>(getEnvVar('USER_BUCKET'), 'users')
    } else if (type === 'DynamoDB') {
      this.store = new DynamoDBStore<User>(getEnvVar('USER_TABLE'), getEnvVar('REGION'));
    } else {
      throw new Error(`invalid STORE_TYPE ${type}`);
    }
    this.subscriptionHandler = subscriptionHandler;
    this.setupRoutes();
  }

  setupRoutes() {
    this.router.get('/self', async (request: RequestWithAuth, response: Response, next: NextFunction) => {
      try {
        const user = await this.store.get(request.auth.user.id);
        response.json(user);
      } catch(error) {
        next(error);
      }
    });
    this.router.put('/self', async (request: RequestWithAuth, response: Response, next: NextFunction) => {
      try {
        const userId = request.auth.user.id;
        const user = { ...request.body, id: userId };
        await this.store.put(userId, user);
        await this.subscriptionHandler.sendMessageToSubscribers(`${userId}`, user);
        response.json(user);
      } catch(error) {
        next(error);
      }
    });
    this.router.post('/self/action', async (request: RequestWithAuth, response: Response, next: NextFunction) => {
      try {
        const user = await this.store.updateState(request.auth.user.id, request.body, rootReducer);
        await this.subscriptionHandler.sendMessageToSubscribers(`${user.id}`, user);
        response.json(user);
      } catch(error) {
        next(error);
      }
    });
  }
}
