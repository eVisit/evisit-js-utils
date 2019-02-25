describe('prop', function() {
	var utils = require('../../dist/utils'),
			obj;

	beforeEach(function() {
    obj = {
    	hello: 'World',
    	deep: {
    		list: [
    			'first',
    			'second',
    			{
    				more: 'yes, more'
    			}
    		],
    		parent: 'deep'
    	},
    	bool: true,
    	number: 5
    };
  });

  it('should be able to properly identify types', function() {
    expect(utils.instanceOf({}, 'object')).toBe(true);
    expect(utils.instanceOf(new String('test'), 'object')).toBe(false);
    expect(utils.instanceOf(new String('test'), 'string')).toBe(true);
    expect(utils.instanceOf('test', 'string')).toBe(true);
    expect(utils.instanceOf(5, 'string')).toBe(false);
  });

  it('should be able to properly expect types', function() {
    var obj = {};
    expect(utils.expectType(obj, 'object')).toBe(obj);
    expect(utils.expectType(new String('test'), 'object', 'derp')).toBe('derp');
    expect(utils.expectType(obj, 'string', 'derp')).toBe('derp');
    expect(utils.expectType(obj, 'function')).toBe(undefined);
  });

	it('should be able to get a property', function() {
    expect(utils.get(undefined, 'hello', 'other')).toBe('other');
    expect(utils.get(null, 'hello', 'other')).toBe('other');
    expect(utils.get(0, 'hello', 'other')).toBe('other');
    expect(utils.get('bad', 'hello', 'other')).toBe('other');
    expect(utils.get(false, 'hello', 'other')).toBe('other');
    expect(utils.get(true, 'hello', 'other')).toBe('other');
    expect(utils.get(obj, 'hello')).toBe('World');
    expect(utils.get(obj, 'bool')).toBe(true);
    expect(utils.get(obj, 'number')).toBe(5);
    expect(utils.get(obj, 'deep.parent')).toBe('deep');
    expect(utils.get(obj, 'deep.list')).toEqual(jasmine.any(Array));
    expect(utils.get(obj, 'deep.list[0]')).toBe('first');
    expect(utils.get(obj, 'deep.list[1]')).toBe('second');
    expect(utils.get(obj, 'deep.list[2].more')).toBe('yes, more');
  });

  it('should be able to set a property', function() {
    expect(() => utils.set(undefined, 'hello', 'Other World')).toThrow(new Error('Attempt to set on and empty context'));

  	utils.set(obj, 'hello', 'Other World');
  	utils.set(obj, 'bool', false);
  	utils.set(obj, 'number', 12);
  	utils.set(obj, 'deep.parent', 'not deep');
		utils.set(obj, 'deep.list[0]', 'FIRST');
		utils.set(obj, 'deep.list[1]', 'SECOND');
		utils.set(obj, 'deep.list[2].more', 'HOLY MOLY!');

    expect(utils.get(obj, 'hello')).toBe('Other World');
    expect(utils.get(obj, 'bool')).toBe(false);
    expect(utils.get(obj, 'number')).toBe(12);
    expect(utils.get(obj, 'deep.parent')).toBe('not deep');
    expect(utils.get(obj, 'deep.list')).toEqual(jasmine.any(Array));
    expect(utils.get(obj, 'deep.list[0]')).toBe('FIRST');
    expect(utils.get(obj, 'deep.list[1]')).toBe('SECOND');
    expect(utils.get(obj, 'deep.list[2].more')).toBe('HOLY MOLY!');
  });

  it('should be able to safeJSONStringify and safeJSONParse', function() {
    var a = { derp: 1, stuff: 'hello' },
        c = {
          test: true,
          stuff: false, toJSON: () => {
            return {
              something: 'else',
              yep: true,
              b
            };
          }
        },
        b = [ { hello: new Date(), things: true, deep: a }, c ];

    a.parent = b;

    var serialized = utils.safeJSONStringify(b);
    expect(serialized.indexOf('::@id@::') > 0).toBe(true);

    var deserialized = utils.safeJSONParse(serialized);

    expect(deserialized[0].things).toBe(true);
    expect(deserialized[0].deep.derp).toBe(1);
    expect(deserialized[0].deep.stuff).toBe('hello');
    expect(deserialized[0].deep.parent).toBe(deserialized);
    expect(deserialized[1].something).toBe('else');
    expect(deserialized[1].yep).toBe(true);
    expect(deserialized[1].b).toBe(deserialized);
  });
});