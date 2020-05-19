import { APIGatewayProxyEvent, Context } from 'aws-lambda';
import awsServerlessExpress from 'aws-serverless-express';
import awsServerlessExpressMiddleware from 'aws-serverless-express/middleware';
import bodyParser from 'body-parser';
import express, { NextFunction, Request, Response } from 'express';
import { Server } from 'http';

import * as log from './log';
import { HttpError } from './HttpError';

export type RouterMap = { [path: string]: express.Router }

export default class ApiGatewayExpress {
  readonly app = express();
  readonly routerMap: RouterMap;
  readonly server: Server;

  constructor(routerMap: RouterMap) {
    this.routerMap = routerMap;
    this.setupMiddlewareAndRoutes();
    this.server = awsServerlessExpress.createServer(this.app);
  }

  setupMiddlewareAndRoutes() {
    this.app.use((request: any, response: Response, next: NextFunction) => {
      request.logInfo = { timestamp: Date.now() };
      next();
    });
    this.app.use(awsServerlessExpressMiddleware.eventContext());
    this.app.use(bodyParser.json());
    this.app.use(log.accessLogMiddleware);

    Object.keys(this.routerMap).forEach(path => {
      this.app.use(path, this.routerMap[path]);
    });

    this.app.use(this.errorMiddleware);
  }

  errorMiddleware(error: HttpError, request: Request, response: Response, next: NextFunction) {
    log.error(error);
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Unexpected Server Error';
    response
      .status(statusCode)
      .send({
        statusCode,
        message,
      });
  }

  handler(event: APIGatewayProxyEvent, context: Context): void {
    awsServerlessExpress.proxy(this.server, event, context);
  }
}
