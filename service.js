/* Core service framework */
var amqp      = require( 'amqplib/callback_api' )
var log       = require( 'npmlog' )
var heartbeat = require( 'amqp-heartbeat' )

// create class and export it
var service = exports = module.exports = {
  version  : null,
  config   : null,
  inbound  : {},
  outbound : {},
  mqURL    : require( './channels/outboundRabbitMQ' ).getRabbitMqURL()
}

// init must be called to start the service
service.init = function ( config, callback ) {
  if ( ! config ) { log.error('Init','"config.json" not found'); process.exit(1) }
  this.config = config
  log.info( 'Init', 'starting service "'+config.serviceName+'"' )
  
  initialzeHeatbeat( this.mqURL, config, this.version )
  .then (
    function() {
      return  initializeOutboundFunctions( config ) 
    } )
  .then( 
    function() { 
      return initializeInboundHooks( config )
    } )
  .then( 
    function() { 
      if ( callback ) callback()  
    } )
  //log.info( 'XX', service )
}


// call this to start consuming messages
service.start = function() {
  for ( var inChannel in service.inbound ) {
    service.inbound[ inChannel ].start()
  }
  log.info( 'Init', 'Service "'+this.config.serviceName+'" started.' )
}

// wrapper for logger
service.log = function ( module, message ) {
  // npmlog may be a messaging backbone in the future
  log.info( module, message )
}

// wrapper for status
service.setHeartbeatStatus = function( statusTxt ) {
  heartbeat.setStatus( statusTxt )
}

// start heartbeat module
function initialzeHeatbeat( mqURL, config, version ) {
  return new Promise( 
    function( resolve, reject ) {
      log.info( 'Init', 'Start heartbeat' )
      heartbeat.start( mqURL, config.serviceName, version )
      resolve()
      return
    }
  )
}


// initialize all inbound connections to the service
function initializeInboundHooks( config ) {
  var promises = [];
  for ( var hook in config.hooks ) {
    var hookCfg = config.hooks[ hook ]
    
    if ( hookCfg.direction == 'inbound' ) {
      
      if ( hookCfg.type == 'RabbitMQ' ) {       
        log.info( 'InboundHooks', 'RabbitMQ subscriber "' + hook + '"' )
        service.inbound[ hook ] = hookCfg
        if ( hookCfg.config  && hookCfg.config.exchange &&  hookCfg.config.filter ) {
          log.info( 'InboundHooks', 'RabbitMQ receiver "' + hook + '": exchange="'+ hookCfg.config.exchange +'" filter="'+hookCfg.config.filter+'"' )
          var mq = require( './channels/inboundRabbitMQ' )
          promises.push( mq.startTopicReceiver( service.inbound[ hook ] ) )
        } else {
          log.error( 'InboundFunctions', '"'+hook+'" has invalid "config", required "exchange" and "filter"' )
          process.exit(1)
        }
  
      } else {
        log.error( 'InboundFunctions', 'Type "'+hookCfg.type+'" for "'+hook+'" is not supported!' )      
      }
    }
  }
  return Promise.all( promises )
}


//initialize all inbound connections to the service
function initializeOutboundFunctions( config ) {
  var promises = [];
  for ( var hook in config.hooks ) {
    var hookCfg = config.hooks[ hook ]
    if ( hookCfg.direction == 'outbound' ) {
      service.outbound[ hook ] = hookCfg
      if ( hookCfg.type == 'RabbitMQ' ) {
        if ( hookCfg.config  && hookCfg.config.exchange &&  hookCfg.config.routingKey ) {
          log.info( 'OutboundFunctions', 'RabbitMQ publisher "' + hook + '": exchange="'+ hookCfg.config.exchange +'" routingKey="'+hookCfg.config.routingKey+'"' )
          var mqOut = require( './channels/outboundRabbitMQ' )
          promises.push( mqOut.startTopicPublisher( service.outbound[ hook ] ) )
        } else {
          log.error( 'OutboundFunctions', '"'+hook+'" has invalid "config", required "exchange" and "filter"' )
          process.exit(1)
        }
      } else {
        log.error( 'OutboundFunctions', 'Type "'+hookCfg.type+'" for "'+hook+'" is not supported!' )      
      }
      
    }
  }
  return Promise.all( promises )
}