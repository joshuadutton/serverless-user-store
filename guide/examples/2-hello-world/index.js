module.exports.helloWorld = async function(event, context) {
  // see example event object here: https://www.serverless.com/framework/docs/providers/aws/events/apigateway#example-lambda-proxy-event-default
  console.log(JSON.stringify(event)); // logs to CloudWatch

  const name = event.queryStringParameters && event.queryStringParameters.name || 'unidentified user';
  
  const responseBody = {
    message: `hello ${name}!`
  };

  const response = {
    statusCode: 200,
    headers: {
        "x-custom-header" : "my custom header value" // Content-Type: application/json is the default Content-Type so is added if none is specified
    },
    body: JSON.stringify(responseBody)  // body must always be a string and should match Content-Type (mime type)
  };
  return response
}
