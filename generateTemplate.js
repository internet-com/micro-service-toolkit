var argv = require('minimist')( process.argv.slice(2) );

if ( ! argv[ 'config' ] ) { console.log('ERROR: Parameter missing: --config=filename'); process.exit(1) }
var config = require( argv[ 'config' ] )
var pkg = require('./package.json');

console.log( "/* micro-service-toolkit: Version "+pkg.version+" */" )
console.log( "var service = require('micro-service-toolkit')\n" )
console.log( "var config  = require('./config.json')\n" )
console.log( "service.init( config, function(){" )
console.log( "  service.log( 'MessageProcessor', 'init done...' )\n" )
for ( var hook in config.hooks ) {
  if ( config.hooks[ hook ].direction == 'inbound' ) {
    if ( config.hooks[ hook ].type == 'RabbitMQ' ) {  
      var mq = require( './channels/inboundRabbitMQ' )
      console.log( "  "+mq.genTemplate( config.hooks[ hook ] ).join( "\n  " ) )
    }
  }
}
console.log( "" )
console.log( "  service.log( 'MessageProcessor', 'starting service...' )" )
console.log( "  service.start()" )
console.log( "})" )

for ( var hook in config.hooks ) {
  if ( config.hooks[ hook ].direction == 'outbound' ) {
    if ( config.hooks[ hook ].type == 'RabbitMQ' ) {  
      var mq = require( './channels/outboundRabbitMQ' )
      console.log( "" )
      console.log( mq.genTemplate( config.hooks[ hook ] ).join( "\n" ) )
    }
  }
}
