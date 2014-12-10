var Promise = require('bluebird');

describe("Bug #161: unmarshalling content error when using RIDs and non-RIDs in parameterized queries", function () {
  var idOne, idTwo;
  before(function () {
    return CREATE_TEST_DB(this, 'testdb_bug_161')
    .bind(this)
    .then(function () {
      return Promise.map([
        'CREATE CLASS testRid EXTENDS V',
        'CREATE PROPERTY testRid.name STRING',
        'CREATE PROPERTY testRid.value INTEGER',

        'INSERT INTO testRid SET name = "one", age = 20',
        'INSERT INTO testRid SET name = "two", age = 30',
      ], this.db.query.bind(this.db));
    })
    .then(function(){
      return this.db.query('SELECT FROM testRid where name = "one"');
    })
    .then(function(one){
      idOne = one[0]['@rid'];
      return this.db.query('SELECT FROM testRid where name = "two"');
    })
    .then(function(two){
      idTwo = two[0]['@rid'];
    });
  });
  after(function () {
    return DELETE_TEST_DB('testdb_bug_161');
  });
  
  describe("SELECT:", function () {
  
    // Control / regression tests
    it('should return two record when using "IN"', function () {
      return this.db.query('SELECT FROM testRid where @rid in [:param0,:param1]', {params: {param0: idOne, param1: idTwo}})
      .then(function (results) {
        results.length.should.equal(2);
        results[0].name.should.equal('one');
      });
    });
    it('should return one record when using "="', function () {
      return this.db.query('SELECT FROM testRid where @rid = :param0', { params: { param0: idOne }})
      .then(function (results) {
        results.length.should.equal(1);
        results[0].name.should.equal('one');
      });
    });
    it('should return one record age < 25', function () {
      return this.db.query('SELECT name, age FROM testRid where name in [:param0,:param1] and age < :param2', {params: {param0: 'one', param1: 'two', param2: 25}})
      .then(function (results) {
        results.length.should.equal(1);
        results[0].name.should.equal('one');
      });
    });
    
    // relevant tests
    it('should return one record age < 25 using @rids', function () {
      return this.db.query('SELECT FROM testRid where @rid in [:param0,:param1] and age < :param2', {params: {param0: idOne, param1: idTwo, param2: 25}})
      .then(function (results) {
        results.length.should.equal(1);
        results[0].name.should.equal('one');
      });
    });
    // This probably is not meant to be supported
    xit('should return two records using string RIDs', function () {
      return this.db.query('SELECT FROM testRid where @rid in [:param0,:param1]', {params: {param0: idOne.toString(), param1: idTwo.toString()}})
      .then(function (results) {
        results.length.should.equal(2);
        results[0].name.should.equal('one');
      });
    });
  
  });
  
  describe("UPDATE:", function () {
    
    // Control / regression test
    it('should update one record using RID strings', function () {
      return this.db.query('UPDATE testRid SET value = :paramage2 RETURN AFTER WHERE @rid = :param0', { params: { param0: idTwo.toString(), paramage2: 10 }})
      .then(function (results) {
        results.length.should.equal(1);
        results[0].name.should.equal('two');
        results[0].value.should.equal(10);
      });
    });
    
    // Relevant test
    it('should update one record using RID object', function () {
      return this.db.query('UPDATE testRid SET value = :paramage2 RETURN AFTER WHERE @rid = :param0', { params: { param0: idTwo, paramage2: 5 }})
      .then(function (results) {
        results.length.should.equal(1);
        results[0].name.should.equal('two');
        results[0].value.should.equal(5);
      });
    });
  
  });
  
});