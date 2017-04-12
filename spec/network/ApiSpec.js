import { API } from '../../lib/api';

class CustomAPIBase extends API {
  constructor() {
    super(...arguments);
  }

  async fetch(opts) {
    if (opts.fail)
      return {fetchCalled: true, status: false};
    else
      return {fetchCalled: true, status: true};
  }
}

describe('API', function() {
  var api, trace;	

	beforeEach(function() {
    trace = [];
    api = new CustomAPIBase((register) => {
      register('test', function(APIRoute) {
        return class TestRoute extends APIRoute {
          constructor() {
            super(...arguments);
            //this.debug = true;
          }

          async before() {
            await super.before(...arguments);
            trace.push('before');
          }

          async beforeSuccess(result) {
            trace.push('beforeSuccess');

            if (result.status !== true)
              throw 'Error fetching resource';
          }

          async success(result) {
            trace.push('success');
          }

          async beforeError(result) {
            trace.push('beforeError');
          }

          async error(result) {
            trace.push('error');
          }

          async always() {
            trace.push('always');
          }
        };
      });
    });
  });

  it('should be able to make a successful call', async function(done) {
    await api.test({
      fail: false
    }).then((data) => {
      expect(trace.join(':')).toEqual('before:beforeSuccess:success:always');
      expect(data.fetchCalled).toBe(true);
      done();
    }, (result) => {
      fail('I should not have failed!');
      done();
    });
  });

	it('should be able to fail inside beforeSuccess', async function(done) {
    await api.test({
      fail: true
    }).then((data) => {
      fail('I should not have succeeded!');
      done();
    }, (result) => {
      expect(trace.join(':')).toEqual('before:beforeSuccess:beforeError:error:always');
      done();
    });
  });

  it('should be able to use fake data', async function(done) {
    api.fakeData = {test: {status: true}};

    await api.test({
      fail: false
    }).then((data) => {
      expect(trace.join(':')).toEqual('before:beforeSuccess:success:always');
      expect(data.fetchCalled).toBe(undefined);
      done();
    }, (result) => {
      fail('I should not have failed!');
      done();
    });
  });

  it('should be able to inherit', async function(done) {
    api.registerRoute('test2', 'test', function(APIRoute) {
      return class Test2Route extends APIRoute {
        constructor() {
          super(...arguments);
        }

        async before() {
          await super.before(...arguments);
          trace.push('before');
        }

        async beforeSuccess(result) {
          await super.beforeSuccess(...arguments);
          trace.push('beforeSuccess');

          if (result.status !== true)
            throw 'Error fetching resource';
        }

        async success(result) {
          await super.success(...arguments);
          trace.push('success');
        }

        async beforeError(result) {
          await super.beforeError(...arguments);
          trace.push('beforeError');
        }

        async error(result) {
          await super.error(...arguments);
          trace.push('error');
        }

        async always() {
          await super.always(...arguments);
          trace.push('always');
        }
      };
    });

    await api.test2({
      fail: false
    }).then((data) => {
      expect(trace.join(':')).toEqual('before:before:beforeSuccess:beforeSuccess:success:success:always:always');
      expect(data.fetchCalled).toBe(true);
      done();
    }, (result) => {
      fail('I should not have failed!');
      done();
    });
  });
});