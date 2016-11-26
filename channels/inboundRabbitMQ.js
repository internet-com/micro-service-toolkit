var log  = require( 'npmlog' )
var amqp = require( 'amqplib/callback_api' )

var mq = exports = module.exports = {}

mq.startTopicReceiver = function ( inService ) {
  
  log.info( 'inboundRabbitMQ','startTopicReceiver ...' )
  inService.rabbitMqURL = this.getRabbitMqURL()
  
  inService.processMessage = 
    function ( message ) {
      log.error('inboundRabbitMQ','Dummy called, please overwrite!')
    }
  
  inService.hookCreChannel = 
    function ( err, conn ) {
      if ( err ) { log.error( 'inboundRabbitMQ', err ); process.exit(1) }
      //log.info( 'hookCreChannel', this.name + ' ...' )  
      conn.createChannel( this.hookDoAsserts.bind( this ) ) 
      // rem: by .bind(this) it will be a method call, otherwise a function call with no ref to this any more :-)
    }

  inService.hookDoAsserts = 
    function ( err, ch ) {
      if ( err ) { log.error( 'inboundRabbitMQ', err ); process.exit(1) }
      log.info( 'inboundRabbitMQ', 'hookDoAsserts '+ this.name + ' ...' )     
      this.ch = ch
      ch.assertExchange( this.config.exchange, 'topic', { durable : false } )
      var queuName = ''
      if ( this.config.queue ) { queuName = this.config.queue }
      log.info( 'inboundRabbitMQ', 'hookDoAsserts queue="'+queuName + '"' )     
      ch.assertQueue(  
        queuName, 
        { exclusive : false }, 
        this.hookBindQueue.bind( this ) 
      )
    }

  inService.hookBindQueue = 
    function ( err, q ) {
      if ( err ) { log.error( 'inboundRabbitMQ', err ); process.exit(1) }
      log.info( 'inboundRabbitMQ', 'hookBindQueue '+ this.name + '...' )
      this.ch.bindQueue( q.queue, this.config.exchange, this.config.filter );
      this.ch.consume( q.queue, this.hookConsume.bind( this ) )
    }

  inService.hookConsume = 
    function ( msg ) {
      this.processMessage( msg )   
      return 
    }
  
  // now start it:
  amqp.connect( inService.rabbitMqURL, inService.hookCreChannel.bind( inService ) )

}

mq.getRabbitMqURL = function() {
  var argv = require('minimist')( process.argv.slice(2) );

  var rabbitUser = 'user'
  var rabbitPwd  = 'password'
  var rabbitHost = 'amq'
  if ( argv[ 'rabbitHost' ] ) { rabbitHost = argv[ 'rabbitHost' ] }
  if ( argv[ 'rabbitUser' ] ) { rabbitUser = argv['rabbitUser'] }
  if ( argv[ 'rabbitPwd' ]  ) { rabbitUser = argv['rabbitPwd'] }

  rabbitMqURL = 'amqp://'+rabbitUser+':'+rabbitPwd+'@'+rabbitHost
  if ( argv[ 'rabbitURL' ] ) { rabbitMqURL = argv[ 'rabbitURL' ] }

  log.info( 'inboundRabbitMQ', 'Using rabbitMqURL "'+rabbitMqURL+'"' )
  return rabbitMqURL
}  


