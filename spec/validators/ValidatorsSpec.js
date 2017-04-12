describe('prop', function() {
  var validators = require('../../lib/validators');

  beforeEach(function() {
  });

  it('should be able to create and use a validator', async function(done) {
    var validatorFunc = validators.validatorFunction('required');
    validatorFunc(undefined, 'validate').then(function() {
      fail('I should not have succeeded!');
      done();
    }).catch(function(error) {
      expect(error).toEqual(jasmine.any(Array));
      expect(error[0]).toBe('error');
      expect(error[1]).toBe('Value required');
      done();
    });

    validatorFunc('not empty', 'validate').then(function(result) {
      expect(result).toEqual(jasmine.any(Array));
      expect(result[0]).toBe('not empty');
      expect(result[1]).toBe('validate');
      done();
    }).catch(function(error) {
      fail('I should not have failed!');
      done();
    });
  });

  it('should be able to chain validators', async function(done) {
    var validatorFunc = validators.validatorFunction('required,email');
    
    validatorFunc('derp', 'validate').then(function() {
      fail('I should not have succeeded!');
      done();
    }).catch(function(error) {
      expect(error).toEqual(jasmine.any(Array));
      expect(error[0]).toBe('error');
      expect(error[1]).toBe('Invalid email address');
      done();
    });

    validatorFunc('derp@test.com', 'validate').then(function(result) {
      expect(result).toEqual(jasmine.any(Array));
      expect(result[0]).toBe('derp@test.com');
      expect(result[1]).toBe('validate');
      done();
    }).catch(function(error) {
      fail('I should not have failed!');
      done();
    });
  });

  it('should be able to pass validators static arguments', async function(done) {
    var validatorFunc = validators.validatorFunction('email(test:derp,hello:true)');
    
    validatorFunc('derp@test.com', 'validate').then(function(result) {
      expect(result).toEqual(jasmine.any(Array));
      expect(result[0]).toBe('derp@test.com');
      expect(result[1]).toBe('validate');
      expect(result[2].test).toBe('derp');
      expect(result[2].hello).toBe(true);
      done();
    }).catch(function(error) {
      fail('I should not have failed!');
      done();
    });
  });

  it('should be able to change validators message', async function(done) {
    var validatorFunc = validators.validatorFunction('required(message:Hawt dog! It is empty!)');
    
    validatorFunc(null, 'validate').then(function(result) {
      fail('I should not have succeeded!');
      done();
    }).catch(function(error) {
      expect(error[1]).toBe('Hawt dog! It is empty!');
      done();
    });
  });
});