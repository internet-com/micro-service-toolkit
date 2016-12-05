var amqp = require( 'amqplib/callback_api' )
var log  = require( 'npmlog' )

var argv = require('minimist')(process.argv.slice(2));
if ( argv.length == 0 ) {
  printUsage()
  exit(0)
}

var rabbitUser = 'user'
var rabbitPwd  = 'password'
var rabbitHost = 'amq'
if ( argv[ 'rabbitHost' ] ) { rabbitHost = argv['rabbitHost'] }
if ( argv[ 'rabbitUser' ] ) { rabbitUser = argv['rabbitUser'] }
if ( argv[ 'rabbitPwd'  ] ) { rabbitUser = argv['rabbitPwd']  }

var rabbitMqURL = 'amqp://'+rabbitUser+':'+rabbitPwd+'@'+rabbitHost

var exchName = 'microservicetoolkit'

var topic    = 'all'

if ( argv[ 'service' ] ) { 
  topic = argv['service'].toLowerCase()+'.all' 
} else { 
  printUsage()
  process.exit(1)
}
  

var cmdMsg = { cmd: 'x' }

if ( argv[ 'cmd' ] == 'start' ) { 
  cmdMsg.cmd = 'start'
} else if ( argv[ 'cmd' ] == 'stop' ) { 
  cmdMsg.cmd = 'stop'
} else if ( argv[ 'cmd' ] == 'kill' ) { 
  cmdMsg.cmd = 'kill'
} else { 
  printUsage()
  process.exit(1)
}

if ( argv[ 'version' ] ) { 
  cmdMsg.version =  argv[ 'version' ]  
}

if ( argv[ 'serviceID' ] ) { 
  cmdMsg.serviceID =  argv[ 'serviceID' ]  
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

function printUsage() {
  console.log( 'Parameter:' )
  console.log( ' --service=<ServiceName>' )
  console.log( ' --cmd=<kill|start|stop>' )
  console.log( ' optional: --version=<string> or --serviceID=<UUID>' )
  console.log( ' optional: --authKey=<secret>' )
	
}

