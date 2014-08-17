/**
 *
 * A lifecycle is a step in the boot/teardown process of a Lifecycle app. By providing lifecycles, app developers and 3rd party module developers can make safe assumptions about what will be run when, and have at least a fighting chance of wiring up their module for you.

 * Lifecycle provides a number of stages. You can see them at:
 *
 *    require('lifecycle').STAGES
 *
 * These will be run in order when your application starts up, and in reverse order on the teardown.
 *
 * A lifecycle in Lifecycle, consists of two stages. A setup, and a teardown. We setup when we start, and teardown when we stop.
 *
 * Each lifecycle has a number of initializers. Add initializers to a particular lifecycle to load your module at just the right time.
 *
 * @file Defines a single Lifecycle
 * @module lifecycle/initializers
 * @exports Stage
 * @exports Initializer
 * @example
 *    require('lifecycle').STAGES // the list of lifeclcyes
 *
 *    var stages = Lifecycle.stages
 *    stages.initialize.setup.initializer('initialize.my.thing', function(app){
 *      app.config.get("some.config.value");
 *      andDoStuff();
 *    });
 */
var toposort = require('toposort'),
    Promise = require('bluebird');

/**
 * @constructor
 * @private
 */
function Initializer(name, options, func) {
  this.name    = name;
  this.before  = options.before;
  this.after   = options.after;
  this.handler = func;
}

/**
 * Check to see if this initializer has been run for the owning object.
 * @param {*} owner - An item that acts as the controlling interest. Usually an instance of Stage.
 * @return {boolean} - true if this stage has been run for this owner before.
 * @private
 */
Stage.prototype.loadedFor = function(owner){
  return this.loaded.indexOf(owner) >= 0;
}

/**
 * A lifecycle manages a portion of the boot process. That could be setup, or teardown.
 * @param {string} name - The name of the stage
 * @constructor
 * @public
 */
function Stage(name){
  this.name = name;
  this.initializers = {};
  this.loaded = [];
}


/**
 * Adds an initializer to this stage
 * @param {string} name - The name of the initializer
 * @param {object} options - An options hash
 * @param {string} [options.before] - An optional name of another initializer in this stage to run before
 * @param {string} [options.after] - An optional name of another initializer in this stage to run after
 * @param {function} func - The function to run as an initialzer. It may return a promise, and will receive the application instance as an argument. If a promise is returned, Lifecycle will wait for it to resolve before moving on.
 */
Stage.prototype.initializer = function(name, opts, func){
  var e = new Error(),
      origStack = e.stack.split('\n'),
      reg = /\((.*)\)/,
      stack = [],
      from;


  origStack.forEach(function(line) {
    if(!reg.test(line)) return '';
    stack.push(line.match(reg)[1].replace(process.cwd(), '.'));
  });

  stack = stack.filter(function(line) {
    if(!line) return false;
    return line.indexOf(__filename) < 0 && !(/lifecycle\/lib\/lifecycle\.js/.test(line)); 
  });

  from = stack[0];

  if( !func ) {
    func = opts;
    opts = {};
  }

  this.initializers[name] = new Initializer(name, opts, func);
  this.initializers[name].fileLocation = from;
  return this.initializers[name];
}

/**
 * Sorts the initializers into the order that they should be loaded in
 * taking into account the before and afters present.
 * @private
 */
Stage.prototype.initializersInLoadOrder = function(){
  var names = Object.keys(this.initializers),
      edges = [],
      nodes,
      sortedNames,
      self = this;

  names.forEach(function(initName){
    var init = self.initializers[initName];
    if(!init){ return }

    if(init.before) {
      if( names.indexOf(init.before) < 0 ) names.push(init.before);
      edges.push([ init.name, init.before ]);
    }
    if(init.after){
      if( names.indexOf(init.after) < 0 ) names.push(init.after);
      edges.push([ init.after, init.name ]);
    }
  });
  sortedNames = toposort.array(names, edges);
  return sortedNames.map(function(n){ return self.initializers[n] });
}

/**
 * Executes the lifecycle, running each initializer in resolved order.
 * If an initializer returns a promise, the next initializer will not run until it is successfully resolved
 * @param {string} [owner] - An object that owns the initializer. Allows multiple owners to run the same initializers in different contexts.
 * @return {promise}
 */
Stage.prototype.execute = function(owner){

  var promise  = Promise.resolve();

  if(owner && this.loadedFor(owner)){
    return promise;
  }
  console.log("Stage:", this.name);

  this.initializersInLoadOrder().forEach(function(init){
    promise = promise.then(function(){
      if ( !init || !init.handler ) return Promise.resolve();
      return init.handler(owner);
    });
  });

  this.loaded.push(owner);
  return promise;
}

exports.Stage = Stage;
exports.Initializer = Initializer;
