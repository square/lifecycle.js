var Lifecycle = require('../../lifecycle'),
    Glob   = require('glob'),
    FS     = require('fs'),
    Path   = require('path'),
    Util   = require('util');

Lifecycle.up.bootstrap('app.shutdownHandlers', function (app) {
  var shutdown = function(){
    app.shutdown().then(function(){
      console.log("Shutdown completed cleanly");
      process.exit(0);
    }).catch(function(err){
      console.error("Could not shutdown cleanly", err);
      process.exit(1);
    });
  };

  ['SIGINT', 'SIGTERM', 'SIGHUP'].forEach(function(sig){
    process.on(sig, function(){
      console.error("Got", sig, "signal. Shutting down");
      shutdown();
    });
  });

  process.on('uncaughtException', function(err){
    console.error("Possible Uncaught Exception", err);
    console.error(err.message, err.stack);
    shutdown();
  });
});

