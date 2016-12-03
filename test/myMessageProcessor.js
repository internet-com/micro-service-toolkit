/* This is a first example of microservice business logic */
var service = require( '../service' ) // to use npm package, replace by: require('micro-service-toolkit')
service.version = '1.0'  // or: require( '.package.json' ).version
  
// config contains all definitions of input and output wiring
var config = require('./config.json')

service.init( config, function(){
  service.log( 'MessageProcessor', 'init done...' )
  // TODO: process things after initialization

  // ============================================================================
  // Receive messages from topic: 
  service.inbound['testMessageProcessor'].processMessage = 
    function ( message ) {
      // TODO MessageProcessor service: Implement testMessageProcessor
      var data = JSON.parse( message.content )
      service.log( 'testMessageProcessor', data )
      // ... do some business ...
      
      this.ch.ack( message )
      //else 
      //this.ch.reject( message, true )
      
      //testMessageSender( {'xyz':'abc'} ) // this will cause an endless loop :-D
      return 
    }
    
  service.log( 'MessageProcessor', 'starting service...' )
  service.start()

})

//============================================================================
// Wrapper to use for sending outbound messages
function testMessageSender( message ) {
  service.log( 'testMessageSender.publish', message)
  service.outbound['testMessageSender'].publish( message )
}