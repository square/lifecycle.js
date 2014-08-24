# Lifecycle

Lifecycle provides a structured way to start and stop your application, allowing for libraries to provide their own hooks into the lifecycle which executes at a known point in the startup and shutdown process.

These hooks can be used to load applications, setup configuration, setup connections and graceful shutdowns etc.

There are two other things provided to help manage your applications startup.

* Configuration
* Commands

Essentially, Lifecycle is a bootloader with defined segments, and provides both a
setup and teardown sequence.

You can use as much or as little of Lifecycle as you like, the intention is to
provide modules with the ability to integrate cleanly via a known API.

Lifecycle also provides a command interface so that plugins can provide commands for your application that run in the correct lifecycles.

## Usage

Create a lifecycle app in `lifecycle.js`:

```javascript
var Lifecycle = require('lifecycle');

var myApp = new Lifecycle({
  appName: 'Bruce',
  appDir:  Path.resolve(Path.join(__dirname, '..'))
});

module.exports = myApp;
```

### Stages

Lifecycle contains a number of specific lifecycle stages.

* bootstrap - load things
* initialize - initialize things
* connections - setup external connections
* starting - bind to listening ports etc
* running - when everything is running

Each of these stages can have initializers added to them.
Each group of initializers runs in order for startup, and then in reverse order for shutdown.
Each stage will wait for all initializers to complete before moving on to the next.

This provides a structured, and shared way to start your applications, and because it's structured, libraries can provide their own initialization functions
that allow them to wire themselves up for your application.

For example, to setup a connection to a database, and then tear it down on shutdown, you'd do something like:

``` javascript
  Lifecycle.up.connections('database.connect', function ( lifecycleApp ) {
    // setup the connection, and optionally return a promise.
  });

  Lifecycle.down.connections('database.disconnect', function ( lifecycleApp ) {
    // Tear down the connections and optionally return a promise.
  });
```

### Lifecycle files

Each file under the 'lifecycle' directory will be loaded before the bootstrap stage is executed. You can use this to create your own lifecycle setup code.
You can also load a lifecycle setup function from a library that is Lifecycle aware.

For example.

lifecycle/protob.js

```javascript
require('protob/lifecycle')( require('lifecycle') );
```

It's up to the library that you're using to setup the correct stages if you use this method, but it can save a lot of boiler plate code.

### Starting your application

#### Console (aliased to `lifecycle c`)

    $> lifecycle console

The console contains your app available at 'app'

    $> lifecycle c

    myApp:development> app.config // your lifecycle apps config

Console loads all stages up to and including `connections` but it does not load `starting` nor `running`.

#### Server (aliased to lifecycle s)

    $> lifecycle server

Starting the server runs all stages.

### Stages

Stages come in two flavours: setup, and teardown.

Lifecycle will load all files inside the 'lifecycle' directory as part of it's
bootstrap where you can either initialize Lifecycle aware modules, or create your
own initializers for a lifecycle.

#### Lifecycles and Initializers

Stages contain initializers which all require a name. These names can be used within the same stage, to run one initializer before or after some other initializer.

```javascript
var Lifecycle = require('lifecycle');

Lifecycle.up.running('gns.ping', {after: 'something.else', before: 'something'}, function(app) {
  console.log("Coming up in GNS");
  return pingGnsUp(app);
});

Lifecycle.down.running('gns.ping', function(app) {
  console.log("Going down in GNS");
  return pingGnsDown(app);
});
```

These are TSorted so if you want to make sure you have a specific position in your order, you should include a before and after. 
You should only include these if you need to position one initializer relative to another.

All initializers may return promises if they are async and need the bootloader
to wait while they do their job. Non-promise returns immediately move on to the
next initializer in parallel.

#### Making your module Lifecycle-aware.

To become aware of Lifecycle, expose a function in your module that can be called
in an initializer. The first argument of this should be the Lifecycle library. An
application should always pass you the Lifecycle object. Inside this function,
just create your setup and teardown initializers in the right lifecycle and
you're done.

```javascript
module.exports = function lifecycleInit(Lifecycle){
  Lifecycle.up.starting('foo', function(app) {
    console.log("My module is so cool", app.config.appName);
  });
};
```

Then, in the application's lifecycle/foo.js file

```javascript
require('foo/lifecycle') (require('lifecycle') );
```

## Commands

Lifecycle provides a command structure so that you can add commands.
Commands are provided by 'commander-plus'

These are executed like:

```
  $> lifecycle my-command
```

You can list the commands by using the --help flag

```
  $> lifecycle --help
```

List the initializers setup for the application:

```
  $> lifecycle initializers
```

#### Setup your own commands

```
  Lifecycle.up.bootstrap('my-lib.commands', function(app) {
    app.commands.command('some:command')
      .description('Do something')
      .action(function() { stuff() });
  });
```

