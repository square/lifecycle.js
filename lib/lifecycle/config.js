/**
 * @exports Config
 */
var deepMerge = require('deepmerge');

module.exports = Config;

/**
 * A configuration object
 * @param {object} opts - The initial configuration values. All values passed will be available as configuration values.
 * @constructor
 * @public
 */
function Config(opts){
  opts = opts || {};
  this.config = {};
  var self = this;
  opts = opts || {};
  Object.keys(opts).forEach(function(key){ self.config[key] = opts[key] });
}

/**
 * Get a value from the configuration.
 * @param {string} keyPath - The key to get. The key can be nested. i.e. 'foo.bar.baz' will get the object at that key path
 * @return {*} - the object found at that keyPath or undefined
 * @public
 */
Config.prototype.get = function(keyPath){
  var parts = keyPath.split("."),
      current = this.config;

  for(var i=0; i<parts.length; i++){
    current = current[parts[i]];
    if(!current) { return undefined; }
  }
  return current;
};

/**
 * Perform a deep merge on the items provided into the existing configuration.
 * @param {object} other - The configuration to merge in. This will overwrite any existing values.
 * @public
 */
Config.prototype.merge = function(other){
  this.config = deepMerge(this.config, other);
}
