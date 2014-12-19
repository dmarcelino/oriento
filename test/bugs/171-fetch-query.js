var Promise = require('bluebird');

describe("Bug #171: graph fetchplan on OrientDB 2.0", function () {
  var idOne, idTwo;
  before(function () {
    return CREATE_TEST_DB(this, 'testdb_bug_171')
    .bind(this)
    .then(function () {
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
    return DELETE_TEST_DB('testdb_bug_171');
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
    it('should return linked records @this.toJSON(fetchPlan)', function () {
      return this.db.query('SELECT @this.toJSON("fetchPlan:out_Eat:1 out_Eat.in:1") from Person').all()
      .then(function (result) {
        var person = JSON.parse(result[0].this);
        //console.log('person: ' + require('util').inspect(person));
        person.name.should.equal('Luca');
        person.should.have.property('out_Eat');
        var edge = person.out_Eat;
        if(edge instanceof Array){
          edge = edge[0];  // OrientDB 2.0 returns Array
        }
        edge.should.have.property('in');
        edge.in.name.should.equal('Dante');
      });
    });
    
    it('should transform vertices when they are linked, using query', function () {
      return this.db.query('SELECT name, out_Eat from Person', { fetchPlan: 'out_Eat:1 out_Eat.in:1' }).all()
      .then(function (people) {
        console.log('people: ' + require('util').inspect(people));
        people.length.should.be.above(0);
        people.forEach(function (person) {
          //person.should.be.an.instanceOf(Person);
          person.name.should.equal('Luca');
          person.should.have.property('out_Eat');
          var edge = person.out_Eat;
          edge.should.be.an.instanceOf(Eat);
          edge.should.have.property('in');
          edge.in.should.be.an.instanceOf(Restaurant);
          edge.in.name.should.equal('Dante');
        });
      });
    });

    it('should transform vertices when they are linked', function () {
      return this.db.select().from('Person').fetch('out_Eat:1 out_Eat.in:1').all()
      .then(function (people) {
        //console.log('people: ' + require('util').inspect(people));
        people.length.should.be.above(0);
        people.forEach(function (person) {
          person.should.be.an.instanceOf(Person);
          person.name.should.equal('Luca');
          person.should.have.property('out_Eat');
          var edge = person.out_Eat;
          edge.should.be.an.instanceOf(Eat);
          edge.should.have.property('in');
          edge.in.should.be.an.instanceOf(Restaurant);
          edge.in.name.should.equal('Dante');
        });
      });
    });
    
    
    });
});
