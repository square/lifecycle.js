var Lifecycle = require('../../lifecycle'),
    sprintf = require('sprintf').sprintf;

Lifecycle.up.bootstrap('lifecycle.commands', function(app) {
  function consoleRepl(){
    var repl = require('repl');
    app.initialize()
      .then(function(){
        var r = repl.start({
          prompt: app.config.get('appName') + ":" + app.config.get('environment') + "> "
        });

        r.context.app = app
        r.context.Lifecycle = app.constructor;

        r.on('exit', function(){
          app.shutdown().finally(function(){ process.exit(0);} );
        });
      })
      .catch(function(err){
        console.log("Error intitializing", err.message, err.stack);
        app.shutdown().finally(function(){
          console.log("Shutdown");
          process.exit(1);
        });
      });
  }

  function server(){
    app.start()
      .then(function(){ console.log("Started") })
      .catch(function(err){
        console.log("Could not start the application, err");
        console.log(err.stack);
        app.shutdown();
        process.exit(1);
      });
  }

  function printInitializers() {
    process.stdout.write('UP:\n');
    Lifecycle.LIFECYCLES.forEach(function(lc) {
      process.stdout.write('  ' + lc + '\n');
      Lifecycle.lifecycles[lc].setup.initializersInLoadOrder().forEach(function(init) {
        if(!init) return;
        process.stdout.write(sprintf("    %-50s%-100s\n", init.name, init.fileLocation));
        // if(init) process.stdout.write('    ' + init.name + '\t\t' + '(' + init.fileLocation + ')\n');
      });
    });

    process.stdout.write('\n\n');
    process.stdout.write('DOWN:\n');
    Lifecycle.LIFECYCLES.reverse().forEach(function(lc) {
      process.stdout.write('  ' + lc + '\n');
      Lifecycle.lifecycles[lc].teardown.initializersInLoadOrder().forEach(function(init) {
        if(!init) return;
        process.stdout.write(sprintf("    %-50s%-100s\n", init.name, init.fileLocation));
        // if(init) process.stdout.write('    ' + init.name + '\t\t' + '(' + init.fileLocation + ')\n');
      });
    });

    process.exit(0);
  }



  app.commands.command("console|c")
    .description("Start a console")
    .action(consoleRepl);

  app.commands.command("server|s")
    .description("start a server")
    .action(server);

  app.commands.command('initializers')
    .description('print initializers in order')
    .action(printInitializers);
});
