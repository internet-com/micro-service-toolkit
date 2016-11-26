/* Core service framework */
var amqp   = require( 'amqplib/callback_api' )
var log    = require( 'npmlog' )
  
// create class and export it
var service = exports = module.exports = {
  config  : null,
  inbound : {}
}

// init must be called to start the service
service.init = function ( config, callback ) {
  if ( ! config ) { log.error('Init','"config.json" not found'); process.exit(1) }
  this.config = config
  log.info( 'Init', 'starting service "'+config.serviceName+'"' )
  initializeOutboundFunctions( config )    
  initializeInboundHooks( config )
  if ( callback ) callback()  
}

// wrapper for logger
service.log = function ( module, message ) {
  // npmlog may be a messaging backbone in the future
  log.info( module, message )
}

// initialize all inbound connections to the service
function initializeInboundHooks( config ) {
  for ( var hook in config.hooks ) {
    var hookCfg = config.hooks[ hook ]
    
    if ( hookCfg.direction == 'inbound' ) {
      
      if ( hookCfg.type == 'RabbitMQ' ) {       
        log.info( 'InboundHooks', 'RabbitMQ subscriber "' + hook + '"' )
        service.inbound[ hook ] = hookCfg
        if ( hookCfg.config  && hookCfg.config.exchange &&  hookCfg.config.filter ) {
          log.info( 'OutboundFunctions', 'RabbitMQ publisher "' + hook + '": exchange="'+ hookCfg.config.exchange +'" filter="'+hookCfg.config.filter+'"' )
          var mq = require( './channels/inboundRabbitMQ' )
          mq.startTopicReceiver( service.inbound[ hook ] )
        } else {
          log.error( 'InboundFunctions', '"'+hook+'" has invalid "config", required "exchange" and "filter"' )
          process.exit(1)
        }
  
      } else {
        log.error( 'InboundFunctions', 'Type "'+hookCfg.type+'" for "'+hook+'" is not supported!' )      
      }
    }
  }
  //log.info( 'XX', service )
}


//initialize all inbound connections to the service
function initializeOutboundFunctions( config ) {
  for ( var hook in config.hooks ) {
    var hookCfg = config.hooks[ hook ]
    if ( hookCfg.direction == 'outbound' && hookCfg.type == 'RabbitMQ' ) {
      
      service[ hook ] = hookCfg
      if ( hookCfg.config  && hookCfg.config.exchange &&  hookCfg.config.routingKey ) {
        log.info( 'OutboundFunctions', 'RabbitMQ publisher "' + hook + '": exchange="'+ hookCfg.config.exchange +'" routingKey="'+hookCfg.config.routingKey+'"' )          
        service[ hook ].publish = function ( message ) {
            log.info( 'publish message', message )          
            // TODO
//            var msg = JSON.stringify( message )
//            channel.assertExchange( 'statistics', 'topic',  { durable : false } )
//            channel.publish( 'statistics', 'statistics.prm', new Buffer( msg ) )
        }
      } else {
        log.error( 'OutboundFunctions', '"'+hook+'" has invalid "config", required "exchange" and "routingKey"' )
        process.exit(1)
      }
    }    
  }
}
