# Serverless User Store

This project is an easy to setup and maintain backend for mobile apps to store user data. It stores each users data as a JSON blob (user state) in DynamoDB (a NoSQL database) or S3 (file storage). As such, it is not intended for complex queries and relationships.

## Guide

I use this project to teach others about Serverless architecture. Go to the [guide](guide/) for step-by-step tutorials for setting up and working with this app.  

## Customization

To make it more powerful and flexible, custom actions and reducers may be added to update a user's state following unidirectional data flow patterns. This is similar to front-end frameworks like Redux, but since we have no view framework to integrate with, no dependencies are needed. Find out how to implement these in guide.


### WebSocket Testing

This project includes WebSockets subscriptions to get updates whenever the user object changes. Here is an easy way to test the WebSockets: 

See data by subscribing to a user using wscat:
```
npm install -g wscat
```

(replace <TOKEN> with user auth token of the user you want to subscribe to):
```
wscat -c wss://<API_GATEWAY_URL> -H Authorization:Bearer <TOKEN>

#local
wscat -c http://localhost:3001 -H Authorization:Bearer <TOKEN>
```