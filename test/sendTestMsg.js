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

var exchName = 'test'

var dummyJob = 
	{
		product: 'XYZ',
		customer: 'Doe',
		parameters: {
			productSize:'L'
		}
	}
	
//subscribe jobs
amqp.connect( rabbitMqURL,
		
		function( err, conn ) {
			if ( err != null ) { log.error( 'RabbitMQ', err ); process.exit(1) }
		
			conn.createChannel( function( err, ch ) {
					if ( err != null ) { log.error( 'RabbitMQ', err ); process.exit(1) }
			
			    var msg = JSON.stringify( dummyJob ) 

					ch.assertExchange( exchName, 'topic',	{ durable : false }	);
			
			    ch.publish( exchName, 'test.order', new Buffer( msg ) )
			    
			    log.info( '"Queued', dummyJob )

		  } )

		  setTimeout( function() { conn.close(); process.exit(0) }, 500 )

		} 
  )