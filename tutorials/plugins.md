Steven is setup to allow plugins and external modules to decide when they set themselves up at known locations during the boot process.

For a plugin to get access to the bootloader, it needs to be initialized. There are 2 main components of this.

1. Add an initialization hook to your module/plugin so that it is Steven aware.
2. Call the initializer in your code by placing it in the Steven directory.

##### Add an initializer to your module

This is as simple as adding and exporting a function from you application. In your moudule, add a new file. steven\_init.js at the top level directory structure.

    // steven_init.js
    module.exports = function(Steven){

      Steven.up.bootstrap('my_module.bootstrapper', function(app) {
        // do stuff
      });

      Steven.up.setup('my_module.runIt', function(app) {
        // do more stuff
      });
    }

By exposing this function, you allow applications to call your initializers and have them added to the boot process.

##### Call your initializer from your application

In your application, to initialize Steven aware plugins, add a file to your "steven" directory. An example of that file might look like:

    // steven/my_module.js
    require('my_module/steven_init')(require('steven'));

You can also add any initializers in the steven directory, even your own application specific ones.
