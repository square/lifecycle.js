A stage is a step in the setup/teardown process of a Lifecycle app. By providing stages, app developers and 3rd party module developers can make safe assumptions about what will be run when, and have at least a fighting chance of wiring up their module for you.

Lifecycle provides a number of stages. You can see them at:

    require('lifecycle').STAGES

These will be run in order when your application starts up, and in reverse order on the teardown.

A stage in Lifecycle, consists of two parts. A setup, and a teardown. We setup when we start, and teardown when we stop.

Each stage has a number of initializers. Add initializers to a particular stage to load your module at just the right time.

#### Use a setup initializer

Setup initializers are used when an application is starting up. The simplest would look like:

    Lifecycle.up.initialize('dr.who', function(app) {
      console.log("Dr Who-oo. Ay, Dr Who");
    });

It doesn't do much, but we could be doing anything in there. The application you're handed is the Lifecycle instance, complete with the configuration object.


    Lifecycle.up.initialize("darlek", {after: "dr.who"}, function(app){
      if(app.config.get("darlek.angry")){
        console.log("EXTERMINATE");
      }
    });

    Lifecycle.up.running("battle", function(app) {
      console.log("It's ON!");
    });


    Lifecycle.down.running("battle", function(app){
      console.log("It's Over...");
    });

You can see here that we're organising the darlek initailizer to run after the dr.who one. It's also checking the applications configuration. Neato hey.

##### Note

If you reference an initializer that does not exist in your before or after, the before/after will be ignored and the initializer will run in any order.
