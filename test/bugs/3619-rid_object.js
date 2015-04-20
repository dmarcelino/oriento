var Promise = require('bluebird');

describe("Bug #3619: returning rid as object", function () {
  before(function () {
    return CREATE_TEST_DB(this, 'testdb_bug_orientdb_3619')
    .bind(this)
    .then(function () {
      this.db.server.transport.connection.protocol.deserializer.enableRIDBags = false;
      return Promise.map([
        'create class Person extends V',
        'create class Restaurant extends V',
        'create class Eat extends E',

        'create vertex Person set name = "Luca"',
        'create vertex Restaurant set name = "Dante", type = "Pizza"',
        'create edge Eat from (select from Person where name = "Luca") to (select from Restaurant where name = "Dante") SET someProperty="something"',
      ], this.db.query.bind(this.db));
    });
  });
  after(function () {
    return DELETE_TEST_DB('testdb_bug_orientdb_3619');
  });

  describe('Query a graph with fetchplan', function () {
    function Person (data) {
      if (!(this instanceof Person)) {
        return new Person(data);
      }
      var keys = Object.keys(data),
          length = keys.length,
          key, i;
      for (i = 0; i < length; i++) {
        key = keys[i];
        this[key] = data[key];
      }
    }

    function Restaurant (data) {
      if (!(this instanceof Restaurant)) {
        return new Restaurant(data);
      }
      var keys = Object.keys(data),
          length = keys.length,
          key, i;
      for (i = 0; i < length; i++) {
        key = keys[i];
        this[key] = data[key];
      }
    }
    
    function Eat (data) {
      if (!(this instanceof Eat)) {
        return new Eat(data);
      }
      var keys = Object.keys(data),
          length = keys.length,
          key, i;
      for (i = 0; i < length; i++) {
        key = keys[i];
        this[key] = data[key];
      }
    }
    
    before(function () {
      this.db.registerTransformer('Person', Person);
      this.db.registerTransformer('Restaurant', Restaurant);
      this.db.registerTransformer('Eat', Eat);
    });
    
    // Control test
    it('should return valid @rid with @this.toJSON(fetchPlan)', function () {
      return this.db.query('SELECT @this.toJSON("rid,fetchPlan:out_Eat:1 out_Eat.in:1") from Person').all()
      .then(function (result) {
        var person = JSON.parse(result[0].this);
        //console.log('person: ' + require('util').inspect(person));
        person.name.should.equal('Luca');
        person.should.have.property('@rid');
        if(person['@rid'].cluster < 0){
          person.should.have.property('rid');
          person.rid.should.have.property('cluster');
          person.rid.cluster.should.be.greaterThan(0);
        }
      });
    });
    
    it('should "rid" with proper RecordID when running query', function () {
      return this.db.query('SELECT @rid, name, out_Eat from Person WHERE name = "Luca"', { fetchPlan: 'out_Eat:1 out_Eat.in:1' }).all()
      .then(function (people) {
        console.log('people: ' + require('util').inspect(people));
        people.length.should.be.above(0);
        people.forEach(function (person) {
          person.name.should.equal('Luca');
          person.should.have.property('@rid');
          if(person['@rid'].cluster < 0){
            person.should.have.property('rid');
            person.rid.should.have.property('cluster');
            person.rid.cluster.should.be.greaterThan(0);
          }
        });
      });
    });

    it('should "rid" with proper RecordID', function () {
      return this.db.select(['@rid', 'name', 'out_Eat']).from('Person').fetch('out_Eat:1 out_Eat.in:1').all()
      .then(function (people) {
        //console.log('people: ' + require('util').inspect(people));
        people.length.should.be.above(0);
        people.forEach(function (person) {
          person.name.should.equal('Luca');
          if(person['@rid'].cluster < 0){
            person.should.have.property('rid');
            person.rid.should.have.property('cluster');
            person.rid.cluster.should.be.greaterThan(0);
          }
        });
      });
    });
    
    
    });
});
