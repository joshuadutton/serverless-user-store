import { S3, AWSError } from 'aws-sdk';

import DataStore, { Action, Reducer, actionHandler } from './DataStore';

export default class S3Store<T> implements DataStore<T> {
  private readonly s3: S3;
  private readonly bucketName: string;
  private readonly keyPrefix: string;

  constructor(bucketName: string, keyPrefix: string = 'data') {
    this.s3 = new S3();
    this.bucketName = bucketName;
    this.keyPrefix = keyPrefix;
  }

  private errorWrapper(error: AWSError, bucketName: string, action: string): Promise<any> {
    // AWS doesn't namespace errors
    error.code = `S3:${error.code}`;
    error.message = `S3:${bucketName}:${action} ${error.message}`;
    return Promise.reject(error);
  }

  private s3KeyForId(id: string) {
    return `${this.keyPrefix}/${id}.json`;
  }

  async get(id: string): Promise<T | undefined> {
    return this.s3.getObject({
      Bucket: this.bucketName,
      Key: this.s3KeyForId(id),
    }).promise()
    .then(object => {
      if (object.Body) {
        return JSON.parse(object.Body.toString('utf8'));
      }
    })
    .catch(error => this.errorWrapper(error, this.bucketName, 'getObject'));
  }
  
  async put(id: string, value: T): Promise<T> {
    if (!value) {
      return Promise.reject(new Error('Value is required'));
    }
    return this.s3.putObject({
      Bucket: this.bucketName,
      Key: this.s3KeyForId(id),
      Body: JSON.stringify(value),
      ContentType: 'application/json',
      CacheControl: 'max-age=0',
    }).promise()
    .then(() => value)
    .catch(error => this.errorWrapper(error, this.bucketName, 'putObject'));
  }

  async delete(id: string) {
    return this.s3.deleteObject({
      Bucket: this.bucketName,
      Key: this.s3KeyForId(id),
    }).promise()
    .catch(error => this.errorWrapper(error, this.bucketName, 'deleteObject'));
  }

  async updateState(id: string, action: Action, reducer: Reducer<T>): Promise<T> {
    return actionHandler(this, id, action, reducer);
  }
}
