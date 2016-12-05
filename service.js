/* Core service framework */
var amqp      = require( 'amqplib/callback_api' )
var log       = require( 'npmlog' )
var heartbeat = require( 'amqp-heartbeat' )

// create class and export it
var service = exports = module.exports = {
  id       : null,
  version  : '0.0',
  config   : null,
  inbound  : {},
  outbound : {},
  mqURL    : require( './channels/outboundRabbitMQ' ).getRabbitMqURL(),
  authKey  : null
  
}

// init must be called to start the service
service.init = function ( config, callback ) {
  if ( ! config ) { log.error('Init','"config.json" not found'); process.exit(1) }
  this.config = config
  log.info( 'Init', 'starting service "'+config.serviceName+'" ('+this.version+')' )
  
  initialzeHeatbeat( this.mqURL, config, this.version )
  .then(
    function() {
      this.id = heartbeat.serviceID
      return initCommandQueue( this )
    })
  .then (
    function() {
      initCommands()
      service.cmd.start()
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
  .catch( 
    function( err ) {
      log.error( 'Init', err )
      process.exit(1) 
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


//call this to start consuming messages
service.stop = function() {
  for ( var inChannel in service.inbound ) {
    service.inbound[ inChannel ].stop()
  }
  for ( var outChannel in service.outbound ) {
    log.info( 'Init', 'Stopping "'+outChannel+'" channel' )
    service.outbound[ outChannel ].conn.close()
  }
  log.info( 'Init', 'Stopping "cmd" channel' )
  service.cmd.stop()
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

function initCommandQueue() {
  var hook = 'microservicetoolkit'
  service.cmd = {
      direction : "inbound",
      name      : hook,
      type      : "RabbitMQ", 
      config: {
        exchange : hook,
        queue    : '',
        filter   : service.config.serviceName.toLowerCase()+".*"        
      }
    }
  var mq = require( './channels/inboundRabbitMQ' )
  return  mq.startTopicReceiver( service.cmd ) 
}

/*
 Message must go to queue "microservicetoolkit" with <serviceName> ad filter
 Example:
 {
   "cmd":<"start"|"kill">
   ,"version":<version>      // optional to address all processes of on version
   ,"sericeId":<uuid of service>   // optional to address a single process
  
 */
function initCommands() {
  service.cmd.processMessage = 
    function ( message ) { // just a draft of my idea
      service.cmd.ch.ack( message )
      var data = JSON.parse( message.content )
      log.info( 'CMD-Message', data )
      // Optional authorization
      if ( service.authKey && service.authKey != data.authKey ) { return }
      // Optional select only one version
      if ( data.version && data.version != service.version ) { return }
      // Optional select a dedicated process
      if ( data.serviceId && data.serviceId != service.id ) { return }
      
      // Commands
      if ( data.cmd == 'start' ) {
          this.start()
      }
      
      if ( data.cmd = 'kill' ) {
	      setTimeout( function () {
	        service.stop()
	        process.exit(0)
	      }, 1000)
      }
  
      if ( data.cmd = 'stop' ) {
    	  // TODO
      }
      return
    }  
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