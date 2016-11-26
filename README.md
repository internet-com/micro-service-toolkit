# micro-service-toolkit
Wire business logic in node with in- and outbound channels (e.g. RabbitMQ) by JSON config.

# What's it?
Having a lot microservices running on node.js and communicating via RabbitMQ topics, it was annoying to see lot of similar infrastructure glue code.

This is a approach:
1. to separate technical infrastructure code completely from business logic
2. no hard coded infrastructure code

The business logic is connected to in- and outbound channels (e.g. an RabbitMQ topic) by defining that in the `config.json`.

# Files in this project
* `config.json`: configuration of the microservices in- and output cannels and the hooked business logic
* `service.js`: the microservice technical framework
* `inboundRabbitMq.js`: first channel plug in
* `myMessageProcessor.js`: dummy micro service business logic part
* `sendTesMsg.js`: create a test message to be processed by the MessageProcessor

# Run the 'MessageProcessor' test service
To start this MessageProcessor micro services:
1. start a RabbitMQ: 
1.1 docker pull rabbitmq
1.2 docker run -d --hostname my-rabbit --name some-rabbit -e RABBITMQ_DEFAULT_USER=user -p 5672:5672 -p 15672:15672 -e RABBITMQ_DEFAULT_PASS=password rabbitmq:3-management 
1.3 Console is on `http://localhost:15672`
2. Prepare the service: `npm install`
3. Start the service: `node myMessageProcessor.js --rabbitHost=localhost`

To send a test message simply run `node sendTestMsg.js --rabbitHost=localhost`