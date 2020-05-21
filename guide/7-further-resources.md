# 7 Further Resources

This is a chapter in the [Intro to Serverless](README.md) guide.

## Setup custom domain and use a free AWS SSL cert

1. Request a public certificate: https://docs.aws.amazon.com/acm/latest/userguide/gs-acm-request-public.html
2. Validate certificate (I prefer DNS validation because it auto-renews): https://docs.aws.amazon.com/acm/latest/userguide/gs-acm-validate-dns.html
3. Setup a custom domain in API Gateway: https://docs.aws.amazon.com/apigateway/latest/developerguide/how-to-custom-domains.html
4. Point DNS (CNAME record) to the generated url

## Admin interface

You can use the DynamoDB and S3 consoles to view data.

DynamoDB: https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/ConsoleDynamoDB.html
S3: https://docs.aws.amazon.com/AmazonS3/latest/user-guide/what-is-s3.html

## Cloudwatch Dashboard


