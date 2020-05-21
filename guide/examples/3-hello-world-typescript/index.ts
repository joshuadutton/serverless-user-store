import 'source-map-support/register'
import { APIGatewayProxyEvent, Context, APIGatewayProxyResult } from 'aws-lambda';

export async function helloWorld(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
  console.log(JSON.stringify(event));

  const name = event.queryStringParameters?.name || 'world';
  const responseBody = {  message: `hello ${name}!` };

  const response = {
    statusCode: 200,
    body: JSON.stringify(responseBody) 
  };
  return response
}
