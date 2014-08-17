/**
 * @file The main lifecycle module. Provides basic glue pieces for an application.
 * @module lifecycle
 */
var Config        = require('./config'),
    Stage     = require('./initializers').Stage,
    Promise = require('bluebird'),
    Path = require('path'),
    Glob = require('glob'),
    FS = require('fs'),
    VERSION = JSON.parse(FS.readFileSync(Path.join(__dirname, "../../package.json"))).version;

var STAGES    = ['bootstrap', 'initialize', 'connections', 'starting', 'running'];

/**
 * The main constructor for Lifecycle. This creates an application.
 *
 * @param {Object} opts - An options hash that becomes part of the configuration
 * @param {Object} opts.config - Fully replace the configuration object with this one. It should match with {@link Config}
 * @param {String} opts.appName - The application name. Required
 * @param {String} opts.appDir - The application root directory. Required.
 *
 * @public
 * @constructor
 */
function Lifecycle(opts){
  opts = opts || {};
  this.config = opts.config || new Config(opts);
  this.cyclesExecuted = [];

  if(!this.config.get('appName')){ throw new Error('No application name specified'); }
  if(!this.config.get('appDir')){ this.config.merge({appDir: process.cwd()}); }

  /** @member {object} - A commander-plus instance for adding commands to your lifecycle app */
  this.commands = require('commander-plus');
  this.commands.version(VERSION);

  Lifecycle.application = this;
}

/**
 * Run the initializers upto but not including 'starting'
 * <ol>
 *   <li>bootstrap</li>
 *   <li>initialize</li>
 *   <li>connections</li>
 * </ol>
 *
 * This is used when starting a console, or runner, where external connections are required but not binding services to ports.
 *
 * @return {promise} Returns the promise that each initializer has run it's course
 * @public
 */
Lifecycle.prototype.initialize = function(){
  if(this.initializePromise) { return this.initializePromise; }

  this.loadLifecycleFiles();

  var self = this,
      idx = Lifecycle.STAGES.indexOf('starting'),
      promise = Promise.resolve();

  Lifecycle.STAGES.slice(0, idx).forEach(function(name){
    promise = promise.then(function(){
      if(Lifecycle.stages[name] && Lifecycle.stages[name].setup) {
        return Lifecycle.stages[name].setup.execute(self).then(function(){
          self.cyclesExecuted.push(name);
        });
      } else {
        return;
      }
    });
  });
  this.initializePromise = promise.then(function(){ console.log('Initialized - ' + self.config.get('appName')); });
  return this.initializePromise;
};

/**
 * Load only the bootstrap initializer
 * @return {promise}
 */
Lifecycle.prototype.bootstrap = function(){
  if(this.bootstrapPromise) { return this.bootstrapPromise; }

  this.loadLifecycleFiles();
  var self = this;

  return Lifecycle.stages.bootstrap.setup.execute(self).then(function(){
    self.cyclesExecuted.push('bootstrap');
  });
};

/**
 * Loads all files found in the 'lifecycle' directory of the project.
 * This is done _prior_ to running any initializers so that modules have a chance to hook into the bootstrap lifecycle
 * @private
 */
Lifecycle.prototype.loadLifecycleFiles = function(){
  var appDir = this.config.get('appDir');
  if(!appDir) { return; }
  Glob.sync(Path.join(appDir, 'lifecycle', '**/*.js')).forEach(function(path){
    require(path);
  });
}

/**
 * Runs all stages up to and including running
 * @return {promise} - a promise that the application has started
 * @public
 */
Lifecycle.prototype.start = function(){
  if(this.startPromise){ return this.startPromise; }
  var self = this,
      promise = this.initialize();

  promise = promise.then(function(){
    var prom  = Promise.resolve();

    Lifecycle.STAGES.forEach(function(name){
      prom = prom.then(function(){
        if(Lifecycle.stages[name] && Lifecycle.stages[name].setup){
          return Lifecycle.stages[name].setup.execute(self).then(function(){
            if(self.cyclesExecuted.indexOf(name) < 0 ){
              self.cyclesExecuted.push(name)
            }
          });
        }
      });
    });
    return prom;
  })

  this.startPromise = promise;
  return promise;
}

/**
 * Shutdown the application, running the teardowns for any initializers that have run.
 * @return {promise}
 * @public
 */
Lifecycle.prototype.shutdown = function(){
  if(this.shutdownPromise) { return this.shutdownPromise; }
  var self = this,
      promise = Promise.resolve();

  this.cyclesExecuted.reverse().forEach(function(name){
    promise = promise.then(function(){
      return Lifecycle.stages[name].teardown.execute(self);
    });
  });

  this.shutdownPromise = promise;
  return promise;
}

/**
 * The collection of stages that are provided by Lifecycle
 * <ol>
 *   <li>bootstrap - Use this to set the stage, adjusting configuration, adding objects etc.</li>
 *   <li>initialize - Use this to initialize your module. This is where the configuration is settled and can be used</li>
 *   <li>connections - Establish connections to external services</li>
 *   <li>starting - bind to ports and generally get ready to rumble</li>
 *   <li>running - The application is starting to run.</li>
 * </ol>
 *
 * Each stage has both a setup and teardown phase.
 * When the stage runs, it returns a promise.
 * That promise must be fulfilled prior to the next stage commencing.
 */
Lifecycle.STAGES = STAGES;

/**
 * The stage objects. Use setup and teardown to add initializers
 * Each stage found in STAGES is provided with two initailizers, setup and teardown.
 * Use the appropriate stage to initialize your code.
 *
 * @example
 *    var connections = Lifecycle.stages.connections;
 *
 *    connections.setup.initializer("connect.to.my.thing", {before: "other"}, function(app){
 *      // do stuff in here.
 *      // Optionally return a promise if you want to wait for your code to finish
 *    })
 *
 *    connections.teardown.initializer("teardown.my.thing", function(app){
 *      // do stuff here to teardown
 *      // optionally return a promise if you want to wait for async stuff.
 *    });
 */
Lifecycle.stages = {};

Lifecycle.up = {};
Lifecycle.down = {};

Lifecycle.STAGES.forEach(function(name){
  Lifecycle.stages[name] = {
    setup:    new Stage(name + ".setup"),
    teardown: new Stage(name + ".teardown")
  }
  Lifecycle.up[name] = function(initializerName, options, fn) {
    return Lifecycle.stages[name].setup.initializer(initializerName, options, fn);
  };

  Lifecycle.down[name] = function(initializerName, options, fn) {
    return Lifecycle.stages[name].teardown.initializer(initializerName, options, fn);
  };
});

module.exports = Lifecycle;

require('./initializers/bootstrap');
require('./initializers/commands');
