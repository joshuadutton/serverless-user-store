import { DynamoDB, AWSError } from "aws-sdk";

import ObjectStore, { Action, Reducer, actionHandler } from './ObjectStore';

export default class DynamoObjectDBStore<T> implements ObjectStore<T> {
  private readonly db: DynamoDB.DocumentClient;
  private readonly tableName: string;
  private readonly timeToLiveSeconds?: number;
  private readonly expiresKey: string;

  constructor(tableName: string, region: string, timeToLiveSeconds?: number, expiresKey: string = 'expires') {
    this.db = new DynamoDB.DocumentClient({ region });
    this.tableName = tableName;
    this.timeToLiveSeconds = timeToLiveSeconds;
    this.expiresKey = expiresKey;
  }

  private errorWrapper(error: AWSError, tableName: string, action: string): Promise<any> {
    // AWS doesn't namespace errors
    error.code = `DynamoDB:${error.code}`;
    error.message = `DynamoDB:${tableName}:${action} ${error.message}`;
    return Promise.reject(error);
  }

  private createExpires(timeToLiveSeconds: number) {
    const timestampSeconds = new Date().getTime() / 1000;
    return timestampSeconds + timeToLiveSeconds;
  }

  async get(id: string): Promise<T | undefined> {
    return this.db.get({
      TableName: this.tableName, 
      Key: { id },
      ConsistentRead: true
    }).promise()
    .then(result => {
      return result.Item as T || undefined;
    })
    .catch(error => this.errorWrapper(error, this.tableName, 'get'));
  }
  
  async put(id: string, item: T): Promise<T> {
    const putItem = { ...item, id };
    if (this.timeToLiveSeconds) {
      putItem[this.expiresKey] = this.createExpires(this.timeToLiveSeconds);
    }
    return this.db.put({
      TableName: this.tableName, 
      Item: putItem 
    }).promise()
    .then(() => {
      return putItem;
    })
    .catch(error => this.errorWrapper(error, this.tableName, 'put'));
  }

  async delete(id: string) {
    return this.db.delete({
      TableName: this.tableName,
      Key: { id }
    }).promise()
    .catch(error => this.errorWrapper(error, this.tableName, 'delete'));
  }

  async updateState(id: string, action: Action, reducer: Reducer<T>): Promise<T> {
    return actionHandler(this, id, action, reducer);
  }
}
