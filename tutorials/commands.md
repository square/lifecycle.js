Adding commands to your plugin via Lifecycle is done via [commander-plus](https://github.com/onmodulus/commander.js).

To add a command, attach a bootstrap initializer in your steven initializer.

    function lifecycleInit(Lifecycle){
      var bootstrap = Lifecycle.lifecycles.bootstrap;

      Lifecycle.up.bootstrap('my_plugin.commands', function(app) {
        app.commands.command('my_command')
          .description('does something')
          .action(function(){
            console.log("Doing something");
          });
      });
    }
