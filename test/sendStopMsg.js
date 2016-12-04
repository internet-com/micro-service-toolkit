var amqp = require( 'amqplib/callback_api' )
var log = require( 'npmlog' )

var argv = require('minimist')(process.argv.slice(2));
var rabbitUser = 'user'
var rabbitPwd  = 'password'
var rabbitHost  = 'amq'
if ( argv[ 'rabbitHost' ] ) {	rabbitHost = argv[ 'rabbitHost' ] }
if ( argv[ 'rabbitUser' ] ) { rabbitUser = argv['rabbitUser'] }
if ( argv[ 'rabbitPwd' ] ) { rabbitUser = argv['rabbitPwd'] }

var rabbitMqURL = 'amqp://'+rabbitUser+':'+rabbitPwd+'@'+rabbitHost

var exchName = 'microservicetoolkit'

var topic    = 'all'

if ( argv[ 'service' ] ) { 
  topic = argv['service'].toLowerCase()+'.all' 
} else { 
  log.error( 'Usage', '--service=<ServiceName>' )
  process.exit(1)
}
  

var cmdMsg = 
	{
		cmd: 'kill'
	}
	
//subscribe jobs
amqp.connect( rabbitMqURL,
		
  function( err, conn ) {
    if ( err != null ) { log.error( 'RabbitMQ', err ); process.exit(1) }
    conn.createChannel( function( err, ch ) {
      if ( err != null ) { log.error( 'RabbitMQ', err ); process.exit(1) }
      var msg = JSON.stringify( cmdMsg ) 
      ch.assertExchange( exchName, 'topic',	{ durable : false }	);  
      ch.publish( exchName, topic, new Buffer( msg ) )
      log.info( '"Queued', cmdMsg )
    } )

  setTimeout( function() { conn.close(); process.exit(0) }, 500 )

} 
  )