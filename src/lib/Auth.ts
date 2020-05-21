import crypto from 'crypto';
import jwt from 'jsonwebtoken';

import * as log from './log';
import DynamoDBStore from './DynamoDBObjectStore';
import { HttpError } from './HttpError';

export interface IamPolicy {
  principalId: string,
  policyDocument: {
    Version: string;
    Statement: [
      {
        Effect: 'Allow' | 'Deny',
        Action: string | string[],
        Resource: string | string[],
      }
    ]
  }
  context: any,
}

type JWT = string;

interface PersistedPassword {
  salt: string;
  hash: string;
  iterations: number;
  scopes: string[];
}

export default class Auth {
  private readonly hashLength = 256;
  private readonly digest = 'sha256';
  private readonly saltLength = 64;
  private readonly iterations = 10000;
  private readonly signingKeyId = '927cde40-41e7-45b1-861a-864f6d6ec269' // uuid to not conflict with other ids
  private signingSecretAsPersistedPassword?: PersistedPassword; // stored as hash in PersistedPassword to look like any other entry in password table
  readonly passwordStore: DynamoDBStore<PersistedPassword>;

  constructor(region: string, passwordTable: string) {
    this.passwordStore = new DynamoDBStore(passwordTable, region);
  }

  private async getSigningSecret(): Promise<string> {
    if (this.signingSecretAsPersistedPassword) {
      // Lambda memory persists if the function is kept warm
      // use this carefully
      return this.signingSecretAsPersistedPassword.hash;
    }

    this.signingSecretAsPersistedPassword = await this.passwordStore.get(this.signingKeyId);
    if (this.signingSecretAsPersistedPassword) {
      return this.signingSecretAsPersistedPassword.hash;
    }

    // this should only ever happen once
    // creates a random key that will used for all JWTs
    this.signingSecretAsPersistedPassword = {
      salt: crypto.randomBytes(this.saltLength).toString('base64'),
      hash: crypto.randomBytes(this.hashLength).toString('base64'),
      iterations: this.iterations,
      scopes: ['user']
    }
    await this.passwordStore.put(this.signingKeyId, this.signingSecretAsPersistedPassword);
    return this.signingSecretAsPersistedPassword.hash;
  }

  async generatePersistedPassword(password: string, scopes: string[]): Promise<PersistedPassword> {
    return new Promise<PersistedPassword>((resolve, reject) => {
      const salt = crypto.randomBytes(this.saltLength).toString('base64');
      crypto.pbkdf2(password, salt, this.iterations, this.hashLength, this.digest, (error, hash) => {
        if (error) {
          reject(error);
        } else {
          resolve({ 
            salt, 
            scopes, 
            iterations: this.iterations, 
            hash: hash.toString('base64'),
          });
        }
      });
    });
  }

  private async verifyPersistedPassword(persistedPassword: PersistedPassword, password: string): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      crypto.pbkdf2(password, persistedPassword.salt, persistedPassword.iterations, this.hashLength, this.digest, (error, hash) => {
        if (error) {
          reject(error);
        } else {
          resolve(persistedPassword.hash === hash.toString('base64'));
        }
      });
    });
  }

  async createToken(id: string, scopes: string[]): Promise<JWT> {
    const signingSecret = await this.getSigningSecret();
    const jwtData = {
      sub: id,
      scopes,
    }
    return jwt.sign(jwtData, signingSecret, { expiresIn: '1h' });
  } 

  async verifyToken(token: JWT, scopes: string[]): Promise<string> {
    const signingSecret = await this.getSigningSecret();
    try {
      const decoded: any = jwt.verify(token, signingSecret);
      let scopeFound = false;
      for (const scope of scopes) {
        if (decoded.scopes.includes(scope)) {
          scopeFound = true;
          break;
        }
      }
      if (!scopeFound) {
        return Promise.reject('invalid scope');
      }
      return decoded.sub;
    } catch(error) {
      return Promise.reject(error);
    }
    
  }

  async addPassword(id: string, password: string, scopes: string[]): Promise<JWT> {
    if (await this.passwordStore.get(id)) {
      return Promise.reject('user already exits');
    }
    if (password.length < 10) {
      return Promise.reject('password must be 10 or more characters long');
    }

    const persistedPassword = await this.generatePersistedPassword(password, scopes);
    await this.passwordStore.put(id, persistedPassword);
    return this.createToken(id, scopes);
  }

  async verifyPassword(id: string, password: string): Promise<JWT> {
    const persistedPassword = await this.passwordStore.get(id);
    if (!persistedPassword) {
      return Promise.reject('incorrect id or password');
    }

    const validPassword = await this.verifyPersistedPassword(persistedPassword, password);
    if (!validPassword) {
      return Promise.reject('incorrect id or password');
    }

    return this.createToken(id, persistedPassword.scopes);
  }

  async authorizeBearerToken(bearerToken: string | undefined, scopes: string[]): Promise<string> {
    try {
      if (!bearerToken) {
        throw new Error('no bearerToken');
      }
      const token = bearerToken.substring(7); // remove "bearer " from token
      return this.verifyToken(token, scopes);
    } catch(error) {
      log.error(error);
      return Promise.reject(new HttpError(403, 'unauthorized'));
    }
  }

  async authHandler(event: any, context: any, scopes: string[]): Promise<IamPolicy> {
    try {
      const bearerToken = event.authorizationToken;
      const sub = await this.authorizeBearerToken(bearerToken, scopes);
      return this.generateIamPolicy({ id: sub }, 'Allow', event.methodArn);
    } catch(error) {
      log.error(error);
      return this.generateIamPolicy({}, 'Deny', event.methodArn);
      // TODO: this doesn't work with serverless-offline. Need to submit an issue/PR
      // return Promise.reject('unauthorized');
    }
  }

  private generateIamPolicy(userInfo: any, effect: 'Allow' | 'Deny', resource: string): IamPolicy {
    return {
      principalId: userInfo.id,
      policyDocument: {
        Version: '2012-10-17',
        Statement: [{
          Effect: effect,
          Action: 'execute-api:Invoke',
          Resource: resource,
        }],
      },
      context: userInfo,
    };
  };
}
