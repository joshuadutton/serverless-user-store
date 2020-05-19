import { Router, NextFunction, Request, Response } from 'express';

import SubscriptionHandler from './lib/SubscriptionHandler';
import DataStore, { getEnvVar } from './lib/DataStore';
import User, { rootReducer } from './User';
import S3Store from './lib/S3Store';
import DynamoDBStore from './lib/DynamoDBStore';


export default class VehicleRouter {
  readonly store: DataStore<User>;
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
    this.router.get('/:id', async (request: Request, response: Response, next: NextFunction) => {
      try {
        const user = await this.store.get(request.params.id);
        response.json(user);
      } catch(error) {
        next(error);
      }
    });
    this.router.put('/', async (request: Request, response: Response, next: NextFunction) => {
      try {
        const user = request.body;
        await this.store.put(user.id, user);
        await this.subscriptionHandler.sendMessageToSubscribers(`${user.id}`, user);
        response.json(request.body);
      } catch(error) {
        next(error);
      }
    });
    this.router.post('/:id/action', async (request: Request, response: Response, next: NextFunction) => {
      try {
        const user = await this.store.updateState(request.params.id, request.body, rootReducer);
        await this.subscriptionHandler.sendMessageToSubscribers(`${user.id}`, user);
        response.json(user);
      } catch(error) {
        next(error);
      }
    });
  }
}
