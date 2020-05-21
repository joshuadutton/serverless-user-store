# 3 Using Typescript and adding dependencies

This is a chapter in the [Intro to Serverless](README.md) guide.

## package.json

We will need to add some dependencies. Package.json is a place to list dependencies, scripts, configuration, and project information. NPM is the Node Package Manager, but I prefer Yarn (created by Facebook FWIW). So let's install that globally:

```bash
npm install -g yarn
```

In project directory use the init tool to create a package.json
```bash
yarn init
# or `npm init` if you prefer
``` 

Follow the prompts.

Install dependencies (source-map-support gives TypeScript line numbers in stack traces instead of transpiled JavaScript)

```bash
yarn add source-map-support
# npm install ...
```

Install dev dependencies (dependencies that are only needed locally for things like building and testing):

```bash
yarn add --dev typescript serverless serverless-offline serverless-plugin-typescript @types/node @types/aws-lambda
```

Add a `.gitignore` that ignores the `node_modules` directory and build files from repo (recommended):

```
# .gitignore file
.serverless
.build
node_modules
```

Add some scripts to your package.json:

```
{
    ...
    "scripts": {
				"start": "serverless offline start --useChildProcesses",
				"deploy": "serverless deploy"
		}
}
```

> Note: --useChildProcesses flag is a temp fix for a typescript hot reload issue (see https://github.com/dherault/serverless-offline/issues/864)

## Why TypeScript?

It's a preference that makes working with JavaScript more enjoyable for me. Some people don't like it because of the additional build times, but I find that it's a lot easier to avoid a number of types of bugs and therefore is a large net time-saver. There are good tools (like the ones we have just installed) that do auto-builds that also save time. 

Warning: It's really just JavaScript! Don't let it fool you into a false sense of security with all its "type checking". It's really nice for development, but it's just that: a development tool and syntactic sugar. At run-time we are back in the wild west of JavaScript.

## serverless.yml

Add a plugins section 

```yaml
plugins:
  - serverless-plugin-typescript
  - serverless-offline
```

## New index.ts

```Typescript
import 'source-map-support/register'
import { APIGatewayProxyEvent, Context, APIGatewayProxyResult } from 'aws-lambda';

export async function handler(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
  console.log(JSON.stringify(event));

  // examples of typing variables, but types will also just be inferred
  const name: string = event.queryStringParameters?.name || 'world';
  const responseBody: { message: string } = { message: `hello ${name}!` };

  // inferred type
  const response = {
    statusCode: 200,
    body: JSON.stringify(responseBody) 
  };
  return response
}
```
