"use strict";

var fowl = require('../index');
var chai = require('chai');

var expect = chai.expect;

var root = '__tests__';

fowl.open();

describe("Transactions", function(){
  
  before(function(done){
    fowl.remove(root);
    fowl.remove('animals');
    fowl.remove('people');
    fowl.remove('tests').then(function(){
      done();
    });
  });
  
  after(function(done){
    var tr = fowl.transaction();
    tr.remove('animals');
    tr.remove('people');
    tr.remove(root);
    tr.remove(['__ind', root]);
    tr.commit().then(function(){
      done();
    })
  });
  
  describe("Creation", function(){
    it("Create document", function(done){
      var tr = fowl.transaction();

      tr.create('animals', {name: 'fox', legs: 4}).then(function(foxId){
        expect(foxId).to.be.a(String);
        tr.get(['animals', foxId]).then(function(fox){
          expect(fox).to.be.an(Object);
          expect(fox).to.have.property('name');
          expect(fox).to.have.property('legs');
          expect(fox.name).to.be('fox')
          expect(fox.legs).to.be(4)
        });
      });
    
      tr.commit().then(function(){
        done();
      })
    });
    
    it("A document should support sub-objects", function(done){
      var tr = fowl.transaction();
    
      tr.create(root, {
        _id: 'objects',
        subobject: {foo: "bar", bar: "foo"}});
      
      tr.get([root, 'objects']).then(function(doc){
        expect(doc.subobject.foo).to.be.equal("bar")
        expect(doc.subobject.bar).to.be.equal("foo")
        done();
      });
    
      tr.commit();
    });
    
    it("A document array should arrays", function(done){
      var tr = fowl.transaction();
    
      tr.create(root, {
        _id: 'array', 
        cars: ['lotus', 'ferrari', 'red bull', 'mercedes', 'renault']});
      
      tr.get([root, 'array', 'cars']).then(function(cars){
        expect(cars).to.have.length(5);
        expect(cars[0]).to.be.equal('lotus');
        expect(cars[1]).to.be.equal('ferrari');
        expect(cars[2]).to.be.equal('red bull');
        expect(cars[3]).to.be.equal('mercedes');
        expect(cars[4]).to.be.equal('renault');
        done();
      });
    
      tr.commit();
    });
    
    it("A document should support integers", function(done){
      var tr = fowl.transaction();
    
      tr.create(root, {
        _id: 'numbers',
        balance: 50000});
      
      tr.get([root, 'numbers']).then(function(doc){
        expect(doc.balance).to.be.equal(50000);
        done();
      });
    
      tr.commit();
    });
    
    it("A document should support decimals", function(done){
      var tr = fowl.transaction();
    
      tr.create(root, {
        _id: 'numbers',
        balance: Math.PI});
      
      tr.get([root, 'numbers']).then(function(doc){
        expect(doc.balance).to.be.equal(Math.PI);
        done();
      });
    
      tr.commit();
    });
    
    
    it("A document should support booleans", function(done){
      var tr = fowl.transaction();
    
      tr.create(root, {
        _id: 'booleans',
        isValid: true
      });
      
      tr.get([root, 'booleans']).then(function(doc){
        expect(doc.isValid).to.be.equal(true);
        done();
      });
    
      tr.commit();
    });
    
    it("A document should support dates", function(done){
      var tr = fowl.transaction();
      var date = Date();
    
      tr.create(root, {
        _id: 'dates',
        start: date
      });
      
      tr.get([root, 'dates']).then(function(doc){
        expect(doc.start).to.be.equal(date);
        done();
      });
    
      tr.commit();
    });
    
    it("A document should support dates", function(done){
      var tr = fowl.transaction();
    
      tr.create(root, {
        _id: 'null',
        value: null,
      });
      
      tr.get([root, 'null']).then(function(doc){
        expect(doc.value).to.be.equal(null);
        done();
      });
    
      tr.commit();
    });
    
  })
  
  describe("Update", function(){
    it("Update document", function(done){
      var tr = fowl.transaction();
    
      tr.create('animals', {name: 'tiger', legs: 4}).then(function(tigerId){
        expect(foxId).to.be.a(String);
      
        tr.put(['animals', tigerId], {legs: 3});
      
        tr.get(['animals', tigerId]).then(function(tiger){
          expect(tiger).to.have.property('name');
          expect(tiger).to.have.property('legs');
          expect(tiger.name).to.be('fox')
          expect(tiger.legs).to.be(4)
        })
      });
    
      tr.commit().then(function(){
        done();
      })
    });
    
    it("Update two documents in the same transaction", function(done){
      var tr = fowl.transaction();
  
      tr.create([root, 'people'], {_id: 1, name: "John", balance: 50});
      tr.create([root, 'people'], {_id: 2, name: "Lisa", balance: 30});

      tr.get([root, 'people', 1], ['balance']).then(function(john){
        john.balance -= 10;
        tr.put([root, 'people', 1], {balance: john.balance});
      });
    
      tr.get([root, 'people', 2], ['balance']).then(function(lisa){
        lisa.balance += 10;
        tr.put([root, 'people', 2], {balance: lisa.balance});
      });
    
      tr.commit().then(function(){
        fowl.get([root, 'people', 1]).then(function(john){
        
          expect(john.balance).to.be.equal(40);
        })
    
        fowl.get([root, 'people', 2]).then(function(lisa){
          expect(lisa.balance).to.be.equal(40);
          done();
        })
      });
    })
  });
  
  describe("Removal", function(){
    it("Remove document", function(done){
      var tr = fowl.transaction();
    
      tr.create([root, 'animals'], {name: 'fox', legs: 4}).then(function(docId){
      
        tr.remove([root, 'animals', docId]);

        tr.get([root, 'animals', docId]).then(function(doc){
          expect(doc).not.to.be.ok();
        })
      });
    
      tr.commit().then(function(){
        done();
      })
    });
  });
  
  describe("Queries", function(){
    it("Find by filtering some property", function(done){
      var tr = fowl.transaction();
    
      tr.create([root, 'people'], { name: "John", lastname: "Smith", balance: 50});
      tr.create([root, 'people'], { name: "Lisa", balance: 30});
  
      tr.find([root, 'people'], {name: "John"}, ['name']).then(function(result){
        expect(result).to.be.an(Array);
      });
  
      tr.commit().then(function(){
        done();
      });
    });
    
    it("Find one between many documents by filtering some property", function(done){
      var tr = fowl.transaction();
    
      //
      // Add many documents
      //
      tr.create([root, 'people'], { name: "Peter", balance: 30});
      tr.create([root, 'people'], { name: "Peter", balance: 45});
      
      for(var i=0; i< 1000; i++){
        tr.create([root, 'people'], { id: i, name: "John", lastname: "Smith", balance: Math.random()});
      }
      
      tr.commit().then(function(){
        //
        // Lets find Lisa
        //
        var tr = fowl.transaction();
      
        tr.find([root, 'people'], {name: "Peter", balance: 30}, ['name', 'balance']).then(function(result){
          expect(result).to.be.a("array");
          expect(result).to.have.length(1);
          expect(result[0]).to.have.property('balance');
          expect(result[0].balance).to.be.equal(30);
          expect(result[0]).to.have.property('name');
          expect(result[0].name).to.be.equal("Peter");
          done();
        }, function(err){
          console.log(err);
        });
  
        tr.commit();
      });
      
    });
  
    it("Find one between many documents using an indexed property", function(done){
      var keyPath = [root, 'indexedpeople'];
    
      fowl.addIndex(keyPath, 'name').then(function(){
        var tr = fowl.transaction();
        
        //
        // Add many documents
        //
        tr.create(keyPath, { name: "Peter", balance: 30});
      
        for(var i=0; i< 1000; i++){
          tr.create(keyPath, { id: i, name: "John", lastname: "Smith", balance: Math.random()});
        }
        
        tr.find(keyPath, {name: "Peter"}, ['name', 'balance']).then(function(result){
          expect(result).to.be.a("array");
          expect(result).to.have.length(1);
          expect(result[0]).to.have.property('balance');
          expect(result[0].balance).to.be.equal(30);
          expect(result[0]).to.have.property('name');
          expect(result[0].name).to.be.equal("Peter");
          done();
        });
          
        tr.commit();
      })
    
    });
  });
  
  describe("Conflicts", function(){
  
  })
  
});


