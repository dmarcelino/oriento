describe.only("Bug orientdb: RID reuse", function () {
  this.timeout(20000);
  before(function () {
    return CREATE_TEST_DB(this, 'testdb_insert_order', 'plocal')  // plocal works, memory breaks
    .bind(this)
    .then(function () {
      return this.db.class.create('Person', 'V');
    });
  });
  after(function () {
    return DELETE_TEST_DB('testdb_insert_order', 'plocal');
  });
  
  describe("RID\'s position increase with inserts", function () {
    var accu = 0;

    before(function (done) {    
      this.db.insert().into('Person').set({a: 1}).one()
        .then(function(){
          this.db.insert().into('Person').set({a: 2}).one();
        })
        .then(function(){
          this.db.insert().into('Person').set({a: 3}).one();
        })
        .then(function(){
          return this.db.delete().from('Person').where({}).scalar();
        })
        .then(function(count){
          count.should.be.equal('3');
          
          for(var i=0; i<10; i++) {
            this.db.insert().into('Person').set({name: 'user' + i, order: i}).one()
              .then(function (item) {
                console.log('id: ' + item['@rid'] + ', name: ' + item.name + ', order: ' + item.order);
                accu++;
                if(accu === 10){
                  done();
                }
              });
          }
        });
    });
    
    it('should retrieve people by id order', function () {
      return this.db.select().from('Person').all()
        .then(function (people) {
          var last = -1;
          people.length.should.equal(10);
          people.forEach(function(item){
            var idPosition = item['@rid'].position;
            idPosition.should.be.above(last);
            last = idPosition;
          });
        });
    });
    
    it('should retrieve people by insertion order', function () {
      return this.db.select().from('Person').all()
        .then(function (people) {
          var last = -1;
          people.length.should.equal(10);
          people.forEach(function(item){
            var insertionOrder = item.order;
            insertionOrder.should.be.above(last);
            last = insertionOrder;
          });
        });
    });
    
  });
});
