# Example Configuration

This configuration contains one RabbitMQ input and one output channel: 

```javascript
{
  "serviceName":"MessageProcessor",
  "hooks": {
    "testMessageProcessor": { 
      "direction":"inbound",
      "name":"testMessageProcessor",
      "type":"RabbitMQ", 
      "config":{
        "exchange":"test",
        "queue":"testMessageProcessor",
        "filter":"test.*"
      }
    },
    "testMessageSender":{ 
      "direction":"outbound",
      "name":"testMessageSender", 
      "type":"RabbitMQ", 
      "config":{
        "exchange":"test",
        "routingKey":"test.me"
      } 
    }
  }
}
```

# Template For Business Logic:

For the full example please have a look at [myMessageProcessor.js](https://github.com/ma-ha/micro-service-toolkit/blob/master/test/myMessageProcessor.js)

```javascript
var service = require('micro-service-toolkit')
var config  = require('./config.json')

service.init( config, function(){

  service.log( 'MessageProcessor', 'init done...' )

  // ============================================================================
  // Receive messages from topic: 
  service.inbound['testMessageProcessor'].processMessage = 
    function ( message ) {
      var data = JSON.parse( message.content )
      // ... do some business ...
      this.ch.ack( message )
      return 
    }
  // ============================================================================
    
  service.start()

})

//============================================================================
// Wrapper to use for sending outbound messages
function testMessageSender( message ) {
  service.log( 'testMessageSender.publish', message)
  service.outbound.testMessageSender.publish( message )
}
```
