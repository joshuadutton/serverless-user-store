import { Router, NextFunction, Request, Response } from 'express';

import ObjectStore, { getEnvVar } from './lib/ObjectStore';
import User from './User';
import Auth from './lib/Auth';


export default class BaseRouter {
  readonly userStore: ObjectStore<User>;
  readonly auth: Auth;
  readonly router = Router();

  constructor(userStore: ObjectStore<User>, auth: Auth) {
    this.userStore = userStore;
    this.auth = auth;
    this.setupRoutes();
  }

  setupRoutes() {
    this.router.get('/auth/login', async (request: Request, response: Response, next: NextFunction) => {
      try {
        const id = request.query.id as string | undefined;
        const password = request.query.password as string | undefined;
        if (!id || !password) {
          throw new Error('id and password required as query params');
        }
        const token = await this.auth.verifyPassword(id, password);
        response.json({ jwtToken: token });
      } catch(error) {
        next(error);
      }
    });
    this.router.put('/auth/register', async (request: Request, response: Response, next: NextFunction) => {
      try {
        const { id, password } = request.body;
        if (!id || !password) {
          throw new Error('id and password required as body params');
        }
        const token = await this.auth.addPassword(id, password, ['self']);
        const user = await this.userStore.put(id, { id });
        response.json({ jwtToken: token, user, });
      } catch(error) {
        next(error);
      }
    });
  }
}
