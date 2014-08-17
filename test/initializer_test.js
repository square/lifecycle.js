var expect = require('expect.js');
var Initializer = require('../lib/lifecycle/initializers').Initializer;
var Stage   = require('../lib/lifecycle/initializers').Stage;

describe("Initializers", function(){
  describe("Initializer", function(){
    it("creates an initializer", function(){
      var handler = function(){};
      var init = new Initializer("some.initializer", {before: "some_other.initializer", after: "something_else"}, handler);
      expect(init.before).to.be("some_other.initializer");
      expect(init.after).to.be("something_else");
      expect(init.handler).to.be(handler);
    });
  });

  describe("Lifecycle", function(){
    it("creates a new boostrap", function(){
      var stage = new Stage('create_bootstrap');
      var init = stage.initializer("thing", { before: "pong", after: "ping"}, function(){ });
      expect(stage.initializers['thing']).to.be(init);
      expect(init.before).to.be("pong");
      expect(init.after).to.be("ping");
      expect(init.handler).not.to.be(undefined);
    });

    describe(".initializersInLoadOrder", function(){
      var stage;

      beforeEach(function(){
        stage = new Stage('order_test');
        stage.initializer('mary'   , {}                   ,                 function() {} );
        stage.initializer('lamb'   , { after: 'little' } ,                  function() {} );
        stage.initializer('a'      , { after: 'mary', before: 'lamb' }    , function() {} );
        stage.initializer('had'    , { after: 'mary', before: 'a' }    ,    function() {} );
        stage.initializer('little' , {}                   ,                 function() {} );
      });

      it("creates the correct order for the initializers", function(){
        var loadOrder = stage.initializersInLoadOrder();
        var names = loadOrder.map(function(init) { return init.name });
        expect(names).to.eql(['mary', 'had', 'a', 'little', 'lamb']);
      });
    });

    describe(".load", function(){
      var stage;

      beforeEach(function(){
        stage = new Stage('load_test');
      });

      it("loads each in load order", function(done){
        var recorder = [];

        stage.initializer('thingOne', {}, function(){ recorder.push('thingOne'); });
        stage.initializer('thingTwo', {}, function(){ recorder.push('thingTwo'); });

        stage.execute('someObject').then(function(){
          expect(recorder).to.eql([ 'thingOne', 'thingTwo' ]);
          recorder = [];
        }).then(function(){
          stage.execute('someObject').then(function(){
            expect(recorder).to.eql([]);
            done();
          }).catch(function(err){ done(err) });
        });
      });
    });
  });
});

