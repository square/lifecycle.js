var expect = require('expect.js'),
    Lifecycle = require('../lib/lifecycle');

describe("Lifecycle", function(){
  var lifecycle;

  beforeEach(function(){
    lifecycle = new Lifecycle({appName: 'foo'});
    lifecycle.config.merge({webService: { gracefulShutdownSeconds: 0.01 }});
  });

  it("sets up the current app as the application", function(){
    expect(Lifecycle.application).to.be(lifecycle);
  });

  describe("configuration", function(){
    it("sets the app name from the constructor", function(){
      expect(lifecycle.config.get('appName')).to.be('foo');
    });
  });

  describe("initialize", function(){
    it("initailizes all stages up to starting", function(done){
      var idx = Lifecycle.STAGES.indexOf('starting'),
          expected = Lifecycle.STAGES.slice(0, idx),
          unexpected = Lifecycle.STAGES.slice(idx, Lifecycle.STAGES.length);

      lifecycle.initialize().then(function(){
        expected.forEach(function(name){
          expect(Lifecycle.stages[name].setup.loadedFor(lifecycle)).to.be(true);
        });
        unexpected.forEach(function(name){
          expect(Lifecycle.stages[name].setup.loadedFor(lifecycle)).to.be(false);
        });
        done();
      }).catch(done);
    });
  });

  describe("start", function(){
    it("runs all the setup stages", function(done){
      lifecycle.start().then(function(){
        Lifecycle.STAGES.forEach(function(name){
          expect(Lifecycle.stages[name].setup.loadedFor(lifecycle)).to.be(true);
        });
        done();
      }).catch(done);
    });
  });

  describe("shutdown", function(){
    it("tears down all the setup stages", function(done){
      lifecycle.start().then(function(){
        return lifecycle.shutdown().then(function(){
          Lifecycle.STAGES.forEach(function(name){
            expect(Lifecycle.stages[name].teardown.loadedFor(lifecycle)).to.be(true);
          });
          done();
        }).catch(done);
      });
    });
  });
});


