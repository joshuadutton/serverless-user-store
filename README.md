# Serverless User Store

This project is an easy to setup and maintain backend for mobile apps to store user data. It stores each users data as a JSON blob (user state) in DynamoDB (a NoSQL database). As such, it is not intended for complex queries and relationships.

## Guide

I use this project to teach others about Serverless architecture. Go to the the [guide](guide/) for step-by-step tutorials for setting up and working with this app.  

## Customization

To make it more powerful and flexible, custom actions and reducers may be added to update a user's state following unidirectional data flow patterns. This is similar to front-end frameworks like Redux, but since we have no view framework to integrate with, no dependencies are needed. Find out how to implement these in guide.


### WebSocket Testing

See data by subscribing to a thing using wscat:
```
npm install -g wscat
```

(replace <THING_ID> with the id of the thing you want to subscribe to):
```
wscat -c wss://<API_GATEWAY_URL> -H thing-id:<THING_ID>

#local
wscat -c http://localhost:3001 -H thing-id:<THING_ID>
```