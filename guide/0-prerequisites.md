# 0 Prerequisites

This is a chapter in the [Intro to Serverless](README.md) guide.

## Node.js

Install node by going to the website and downloading the latest LTS (Long Term Support) version: https://nodejs.org/en/

Node also comes with a package manager, NPM. We will be using NPM to install other required dependencies.

> Note about Node LTS: AWS Lambda only officially supports LTS versions. Unfortunately, AWS can be a little slow adding the latest LTS version to Lambda when it first comes out. However, this may change now that Lambda has a much more flexible runtime architecture that supports custom runtimes (you can run any version of Node with a custom runtime). You can find the latest supported runtimes here: https://docs.aws.amazon.com/lambda/latest/dg/lambda-runtimes.html

## AWS Account

You can create an AWS account by going to https://aws.amazon.com. Account creation requires a credit card, but AWS has a free tier to try out many of their services for free (all of the services used in this tutorial are included in the free tier). For more information, see https://aws.amazon.com/free. 

Setup a non-root account user with admin permissions and `Programmatic access` following this guide: https://docs.aws.amazon.com/IAM/latest/UserGuide/getting-started_create-admin-group.html. Save your `access key ID` and `secret access key` in a safe place for use with the AWS CLI.

> Note about AWS Costs: One of the reasons to go Serverless is to minimize cost. Since AWS services are all pay per use, your costs will be minimized during development and early-adoption. At larger scales, Serverless services may end up costing more than reserved server and database instances. That said, it is hard to account for all of the additional DevOps costs in maintaining servers that aren't fully managed. It is my opinion that Serverless is easier and more cost effective in most cases that align well with the supported services.

## AWS CLI

Install the AWS CLI using this guide: https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-install.html

Configure the CLI using this guide: https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-configure.html. By the time you are done, you should have a file called `~/.aws/credentials` with your `access key ID` and `secret access key`.

Further reading: [Serverless Framework credentials guide](https://www.serverless.com/framework/docs/providers/aws/guide/credentials/)

## Serverless Framework

Install the Serverless Framework by following this guide: https://www.serverless.com/framework/docs/getting-started/. We will discuss the benefits of using the Serverless Framework in the next chapter.

## Optional: Visual Studio Code (VSCode)

VSCode is my preferred editor for most languages, including JavaScript. Download it here: https://code.visualstudio.com/

