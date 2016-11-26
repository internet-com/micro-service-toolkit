/* This is a first example of microservice business logic */
var service = require( '../service' ) // to use npm package, replace by: require('micro-service-toolkit')

// config contains all definitions of input and output wiring
var config = require('./config.json')

service.init( config, function(){
  // TODO: process things after intialization
})

// ============================================================================
// Receive messages from topic: 
service.inbound['testMessageProcessor'].processMessage = 
  function ( message ) {
    // TODO MessageProcessor service: Implement testMessageProcessor
    var data = JSON.parse( message.content )
    service.log( 'testMessageProcessor', data )
    // ... do some business ...
    
    this.ch.ack( message )
    //else this.ch.reject(msg, true);
    
    //testMessageSender( {'xyz':'blub'} )
    return 
  }


//============================================================================
// Wrapper to use for sending outbound messages
function testMessageSender( message ) {
  service.log( 'testMessageSender.publish', message)
  service.testMessageSender.publish( message )
}