describe("Bug #260: Unable to save plain Embedded ORecord", function () {
  before(function () {
    return CREATE_TEST_DB(this, 'testdb_bug_260')
    .bind(this)
    .then(function () {
      return this.db.class.create('TestEmbedded');
    })
    .then(function (TestEmbedded) {
      return TestEmbedded.property.create([
        {
          name: 'name',
          type: 'string'
        },
        {
          name: 'obj',
          type: 'embedded'
        }
      ]);
    });
  });
  after(function () {
    return DELETE_TEST_DB('testdb_bug_260');
  });

  it('should insert an embedded object into the database', function () {
    return this.db
    .insert()
    .into('TestEmbedded')
    .set({
      name: 'abc',
      obj: {
        k1: 'v1',
        k2: 'v2'
      }
    })
    .one()
    .then(function (res) {
      res.obj.k1.should.equal('v1');
    });
  });
});
