var log  = require( 'npmlog' )
var amqp = require( 'amqplib/callback_api' )

var mq = exports = module.exports = {}

mq.startTopicPublisher = function ( outService ) {
  
  log.info( 'outboundRabbitMQ','startTopicPublisher ...' )
  outService.rabbitMqURL = this.getRabbitMqURL()
  
  outService.publishMessage = 
    function ( message ) {
      log.error('outboundRabbitMQ','Dummy called, please overwrite!')
    }
  
  outService.hookCreChannel = 
    function ( err, conn ) {
      if ( err ) { log.error( 'outboundRabbitMQ', err ); process.exit(1) }
      log.info( 'hookCreChannel', this.name + ' ...' )  
      conn.createChannel( this.hookDoAsserts.bind( this ) ) 
      // rem: by .bind(this) it will be a method call, otherwise a function call with no ref to this any more :-)
    }

  outService.hookDoAsserts = 
    function ( err, ch ) {
      if ( err ) { log.error( 'outboundRabbitMQ', err ); process.exit(1) }
      log.info( 'outboundRabbitMQ', 'hookDoAsserts '+ this.name + ' ...' )     
      this.ch = ch
      ch.assertExchange( this.config.exchange, 'topic', { durable : false } )
      this.resolve()
      return
    }

  outService.publish = 
    function ( msg ) {
      this.ch.publish( 
          this.config.exchange, 
          this.config.routingKey, 
          new Buffer( JSON.stringify( msg ) ) )
      return 
    }
  
  // now start it:
  return new Promise( 
      function( resolve, reject ) {
        outService.resolve = resolve
        amqp.connect( outService.rabbitMqURL, outService.hookCreChannel.bind( outService ) )
      } 
  )
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

  log.info( 'outboundRabbitMQ', 'Using rabbitMqURL "'+rabbitMqURL+'"' )
  return rabbitMqURL
}  


mq.genTemplate = function( cfg ) {
  var t = []
  if ( ! cfg && ! cfg.name ) {
    t.push( "// ERROR: config not valid, 'name' attibute missing " )
    return t
  }
  t.push( "function "+cfg.name+"( message ) { ")
  t.push( "  service.outbound['"+cfg.name+"'].publish( message )")
  t.push( "}" )
  
  return t
}