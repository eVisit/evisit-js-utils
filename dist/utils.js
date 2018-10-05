// (c) 2017 Wyatt Greenway - devoir
// This code is licensed under MIT license (see LICENSE.txt for details)
// Use unrestricted with the permission of the author

'use strict';

/**
	* eVisit Utility Functionality
	* @namespace {evisit-core-js}
	* @namespace {utils}
	*/

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var root = {};

function defineProperty(writable, obj, name, value, get, set) {
  var def = {
    enumerable: false,
    configurable: writable
  };

  if (get instanceof Function || set instanceof Function) {
    def.get = get;
    def.set = set;
  } else {
    def.writable = writable;
    def.value = value;
  }

  Object.defineProperty(obj, name, def);
}

var defineROProperty = defineProperty.bind(undefined, false),
    defineRWProperty = defineProperty.bind(undefined, true);

function uid() {
  return 'U' + uidCounter++;
};

function initMeta(node, namespace) {
  var metaContext;

  if (!node.hasOwnProperty('_meta')) {
    var thisUID = uid();
    metaContext = { '_UID': thisUID, '_aliases': {} };
    defineRWProperty(node, '_meta', metaContext);
  } else {
    metaContext = node._meta;
  }

  if (arguments.length > 1 && namespace) {
    if (!node._meta.hasOwnProperty(namespace)) {
      metaContext = {};
      defineRWProperty(node._meta, namespace, metaContext);
    } else {
      metaContext = metaContext[namespace];
    }
  }

  return metaContext;
}

function initAudit(node) {
  if (node && (!Object.isExtensible(node) || Object.isFrozen(node))) return;

  var timeCreated = getTimeNow();
  defineRWProperty(node, '_audit', {
    'base': { created: timeCreated, modified: timeCreated, updateCount: 0 },
    '_meta': { created: timeCreated, modified: timeCreated, updateCount: 0 }
  });
}

var uidCounter = 1;
root.uid = uid;

var getTimeNow = root.now = function () {
  if (typeof performance !== 'undefined' && performance.now) return performance.now.bind(performance);

  if (typeof process !== 'undefined' && process.hrtime) {
    var nanosecondsInMilliseconds = 1000000;
    return function () {
      var hrTime = process.hrtime();
      return hrTime[0] * 1000 + hrTime[1] / nanosecondsInMilliseconds;
    };
  } else if (typeof preciseTime !== 'undefined') {
    return preciseTime;
  }

  return function () {
    return new Date().getTime() / 1000;
  };
}();

//This function is deliberately large and confusing in order to squeeze
//every ounce of speed out of it
function prop(cmd, _node, namespace) {
  var node = _node,
      GET = 0x01,
      SET = 0x02,
      REMOVE = 0x04,
      c,
      isMetaNS = false,
      isMeta = false,
      argStartIndex,
      argStartIndexOne,
      context,
      op = (c = cmd.charAt(0)) === 'g' ? GET : c === 's' ? SET : REMOVE,
      finalPath = [];

  switch (cmd) {
    case 'getMetaNS':
    case 'setMetaNS':
    case 'removeMetaNS':
      isMetaNS = isMeta = true;
      argStartIndex = 3;
      argStartIndexOne = 4;

      if (!node.hasOwnProperty('_meta') || !node._meta.hasOwnProperty(namespace)) context = initMeta(node, namespace);else context = node._meta[namespace];

      finalPath = ['_meta', namespace];

      break;
    case 'getMeta':
    case 'setMeta':
    case 'removeMeta':
      isMeta = true;
      argStartIndex = 2;
      argStartIndexOne = 3;

      if (!node.hasOwnProperty('_meta')) context = initMeta(node);else context = node._meta;

      finalPath = ['_meta'];

      break;
    default:
      argStartIndex = 2;
      argStartIndexOne = 3;
      context = node;
      break;
  }

  //Do we need to return the default value?
  if (!context || !(context instanceof Object) || typeof context === 'string' || typeof context === 'number' || typeof context === 'boolean' || context instanceof String || context instanceof Number || context instanceof Boolean) {
    if (op & (GET | REMOVE)) return arguments[argStartIndexOne];

    throw new Error('Attempt to set on and empty context');
  }

  var prop,
      fullPath = '' + arguments[argStartIndex],
      nextIsArray,
      parts = [];

  //No path
  if (!fullPath) {
    if (op & SET) return '';

    if (op & REMOVE) return;

    return arguments[argStartIndexOne];
  }

  //Are there any parts to handle?
  if (fullPath.indexOf('.') > -1 || fullPath.indexOf('[') > -1) {
    if (fullPath.indexOf('\\') > -1)
      //If we have character escapes, take the long and slow route
      parts = fullPath.replace(/([^\\])\[/g, '$1.[').replace(/([^\\])\./g, '$1..').replace(/\\([.\[])/g, '$1').split('..');else
      //Fast route
      parts = fullPath.replace(/\[/g, '.[').split('.');

    for (var i = 0, i2 = 1, il = parts.length; i < il; i++, i2++) {
      var part = parts[i],
          isLast = i2 >= il,
          isArrayIndex = part.charAt(0) === '[';

      //Is this an array index
      if (isArrayIndex) part = part.substring(1, part.length - 1);

      //Get prop
      prop = context[part];

      if (op & REMOVE && isLast) {
        //If this is the final part, and we are to remove the item...
        if (context && (!Object.isExtensible(context) || Object.isFrozen(context))) return prop;

        if (arguments[argStartIndexOne] === true)
          //ACTUALLY delete it if the user forces a delete
          delete context[part];else
          //Otherwise do it the performant way by setting the value to undefined
          context[part] = undefined;

        //Return whatever the value was
        return prop;
      } else if (op & SET) {
        //Are we setting the value?

        //If this is the last part, or the value isn't set,
        //or it is set but the path continues and it
        //needs to be overwritten
        if (isLast || prop === undefined || prop === null || !isLast && (!(prop instanceof Object) || prop instanceof Number || prop instanceof String || prop instanceof Boolean)) {
          //If the next part is an array, make sure to create an array
          nextIsArray = !isLast && parts[i2].charAt(0) === '[';

          //What is our new value?
          prop = isLast ? arguments[argStartIndexOne] : nextIsArray ? [] : {};

          //Update context accordingly
          if (context instanceof Array && !part) {
            isArrayIndex = true;
            if (context && Object.isExtensible(context) && !Object.isFrozen(context)) {
              part = '' + (context.push(prop) - 1);
              context = prop;
            }
          } else if (part) {
            if (context && Object.isExtensible(context) && !Object.isFrozen(context)) context[part] = prop;
            context = prop;
          }
        } else {
          context = prop;
        }

        if (part) finalPath.push(isArrayIndex ? '[' + part + ']' : part);
      } else {
        if (prop === undefined || prop === null || (typeof prop === 'number' || prop instanceof Number) && (isNaN(prop) || !isFinite(prop))) return arguments[argStartIndexOne];
        context = prop;
      }
    }
  } else {
    if (op & REMOVE) {
      prop = context[fullPath];

      if (context && (!Object.isExtensible(context) || Object.isFrozen(context))) return prop;

      if (arguments[argStartIndexOne] === true)
        //ACTUALLY delete it if the user forces a delete
        delete context[part];else
        //Otherwise do it the performant way by setting the value to undefined
        context[part] = undefined;

      //Return whatever the value was
      return prop;
    } else if (op & SET) {
      if (context && Object.isExtensible(context) && !Object.isFrozen(context)) context[fullPath] = arguments[argStartIndexOne];

      return fullPath;
    }

    prop = context[fullPath];
  }

  if (op & GET) {
    //Do we need to return the default value?
    if (prop === undefined || prop === null || (typeof prop === 'number' || prop instanceof Number) && (isNaN(prop) || !isFinite(prop))) return arguments[argStartIndexOne];
    return prop;
  }

  if (!node.hasOwnProperty('_audit')) initAudit(node);

  var lastUpdated = getTimeNow();
  if (isMeta && node._audit) {
    var m = node._audit.meta;
    m.modified = lastUpdated;
    m.updateCount++;
  } else if (node._audit) {
    var b = node._audit.base;
    b.modified = lastUpdated;
    b.updateCount++;
  }

  return op & SET ? finalPath.join('.').replace(/\.\[/g, '[') : prop;
}

/**
* @function {id} Get/set object id. By default every object will have a unique id. This id is stored in the objects meta properties
* @param {Object} {obj} Object to get / set id from
* @param {String} {[set]} If specified set object id to this
* @return {String} Objects id
* @see getMeta
* @see setMeta
* @see get
* @see set
**/
function id(node, set) {
  if (arguments.length === 0) return;

  if (!node.hasOwnProperty('_meta')) initMeta(node);

  if (arguments.length === 1) return node._meta._UID;

  if (!node.hasOwnProperty('_audit')) initAudit(node);

  node._meta._UID = set;

  var m = node._audit.meta;
  m.modified = getTimeNow();
  m.updateCount++;

  return set;
}

/**
* @function aliases Get/set object aliases (from meta properties)
* @param {Object} {obj} Object to get / set aliases from
* @param {Array|String} {[set]} If specified as an Array, set the entire aliases array to this. If specified as a string, add this alias to the list of aliases
* @return {Array} List of aliases
* @see getMeta
* @see setMeta
**/
function aliases(node, set) {
  if (arguments.length === 0) return;

  if (!node.hasOwnProperty('_meta')) initMeta(node);

  if (arguments.length === 1) return node._meta._aliases;

  if (!set) return;

  if (!node.hasOwnProperty('_audit')) initAudit(node);

  if (set instanceof Array) {
    node._meta._aliases = set;
  } else if (node._meta._aliases.indexOf(set) < 0) {
    node._meta._aliases.push(set);
  }

  var m = node._audit.meta;
  m.modified = getTimeNow();
  m.updateCount++;

  return node._meta._aliases;
}

/**
* @function audit Get audit information on object
* @param {Object} {obj} Object to get audit information on
* @param {String} {[which]} 'meta' or 'base'. If 'meta', get audit information on meta property updates. If 'base', get audit information on base property updates. If neither is specified, get the most recently updated (meta or base, whichever is most recent)
* @return {Object} Meta information object, i.e {created: (timestamp), modified: (timestamp), updateCount: (count)}
**/
function audit(node, _which) {
  if (arguments.length === 0) return;

  var which = _which || '*';

  if (!node.hasOwnProperty('_audit')) initAudit(node);

  switch (which) {
    case '*':
      var m = node._audit.meta,
          b = node._audit.base;
      return m.modified > b.modified ? m : b;
    case 'meta':
      return node._audit.meta;
    case 'base':
      return node._audit.base;
  }
}

/**
* @function empty Delete ALL deletable properties from an object. This is useful when
* you want to "empty" an object while retaining all references to this object.
* @param {Object} {obj} Object to "clear"
* @return {Object} Same object but with all properties removed
* @note This could possibly have huge performance implications
**/
function empty(obj) {
  var keys = Object.keys(obj);
  for (var i = 0, len = keys.length; i < len; i++) {
    var k = keys[i];
    if (k === '_meta' || k === '_audit') continue;

    delete obj[k];
  }

  if (obj._meta || obj._audit) {
    if (!obj.hasOwnProperty('_audit')) initAudit(obj);

    var b = obj._audit.base;
    b.modified = getTimeNow();
    b.updateCount++;
  }
}

/**
* @function {instanceOf} Check to see if object is any of the specified data types.
* @param {Object} {obj} Object to check
* @param {String|Constructor} {types...} Data type(s) to check against
* @return {Boolean} **true** if object matches any one of *types*, **false** if not.
*/
function instanceOf(obj) {
  function testType(obj, _val) {
    function isDeferredType(obj) {
      if (obj instanceof Promise) return true;

      if (obj instanceof Object && obj.then instanceof Function) return true;

      return false;
    }

    if (obj === undefined || obj === null) return false;

    var val = _val,
        typeOf = typeof obj === 'undefined' ? 'undefined' : _typeof(obj);

    if (val === String) val = 'string';else if (val === Number) val = 'number';else if (val === Boolean) val = 'boolean';else if (val === Function) val = 'function';else if (val === Array) val = 'array';else if (val === Object) val = 'object';

    if (val === 'deferred' && isDeferredType(obj)) return true;

    if (val === 'number' && (typeof obj === 'number' || obj instanceof Number) && (isNaN(obj) || !isFinite(obj))) return false;

    if (val === typeOf) return true;

    if (val === 'number' && obj instanceof Number) return true;

    if (val === 'string' && obj instanceof String) return true;

    if (val === 'boolean' && obj instanceof Boolean) return true;

    if (val === 'function' && obj instanceof Function) return true;

    if (val === 'array' && obj instanceof Array) return true;

    if (val instanceof Function && obj instanceof val) return true;

    return false;
  }

  if (arguments.length === 2 && arguments[1] === 'object') return arguments[0] && !instanceOf(arguments[0], 'string', 'number', 'boolean', 'array', 'function');

  for (var i = 1, len = arguments.length; i < len; i++) {
    if (testType(obj, arguments[i]) === true) return true;
  }

  return false;
};

/**
* @function {expectType} Check to see if first argument is any of **types**, if it isn't, return **defaultValue**
* @param {Object} {obj} Object to check
* @param {String|Class|Array[String|Class]} {types...} Data type(s) to check against
* @param {Object} {defaultValue} Default value to return if **obj** doesn't match any of the specified types
* @return {Boolean} **true** if object matches any one of *types*, **false** if not.
*/
function expectType(obj, _types, defaultValue) {
  var types = _types instanceof Array ? _types : [_types];
  return instanceOf.apply(this, [obj].concat(types)) ? obj : defaultValue;
}

/**
* @function {sizeOf} Return the size of an Object, Array or String. Size is ascertained in the following manner:<br>
* 1. If the object passed in has a "size" function, this will be called and the value returned will be the "size".
* 2. If the object is an Array or a String, return the "length"
* 3. If the object contains a "length" property, return that as the "size"
* 4. If the object is an instance of Object, return the number of "keys" the plain object contains
* 5. Otherwise return 0
* @param {Object|String|Array} {obj} Object, Array, or String to report size on
* @return {Number} Size / length of object
*/
function sizeOf(obj) {
  if (obj === undefined || obj === null) return 0;

  if (obj.size instanceof Function) return obj.size();

  if (obj instanceof Array || typeof obj === 'string' || obj instanceof String) return obj.length;

  if (obj.length !== undefined && obj.length !== null) return obj.length;

  if (obj instanceof Object) return Object.keys(obj).length;

  return 0;
};

/**
* @function {noe} Check to see if an Object, Array, String, or Number is empty, null or undefined.
*	A string that is nothing but whitespace is considered empty. If the Object
*	is a Number, return true if it *isNaN* or *!isFinite*
* @param {Object|String|Array|Number} {[args...]} Arguments to check
* @return {Boolean} **true** if *all* arguments are 'null or empty', **false** otherwise.
*/
function noe() {
  for (var i = 0, len = arguments.length; i < len; i++) {
    var val = arguments[i];
    if (val === undefined || val === null) return true;

    if ((typeof val === 'string' || val instanceof String) && !val.match(/\S/)) return true;

    if ((typeof val === 'number' || val instanceof Number) && (isNaN(val) || !isFinite(val))) return true;

    if ((typeof val === 'undefined' ? 'undefined' : _typeof(val)) === 'object') {
      if (sizeOf(val) == 0) return true;
    }
  }

  return false;
};

/**
* @function {firstOf} returns the first element of provided Array or String.
*	If the param is not an instance of Array or String, defaultValue is returned.
* @param {Array} {value} Array or String to get element from
* @param {*} {[defaultValue=undefined]} Specify a default value to return if provided value is not an instance of Array or String, or element is null or undefined
* @return {*} first element of array / string, **undefined** if does not exist.
*/
function firstOf(value, defaultValue) {
  if (!value || !value.length) return defaultValue;
  var fetchValue = value[0];
  return fetchValue == null && arguments.length > 1 ? defaultValue : fetchValue;
};

/**
* @function {lastOf} returns the last element of provided Array or String.
*	If the param is not an instance of Array or String, defaultValue is returned.
* @param {Array} {value} Array or String to get element from
* @param {*} {[defaultValue=undefined]} Specify a default value to return if provided value is not an instance of Array or String, or element is null or undefined
* @return {*} last element of array / string, **undefined** if does not exist.
*/
function lastOf(value, defaultValue) {
  if (!value || !value.length) return defaultValue;
  var fetchValue = value[value.length - 1];
  return fetchValue == null && arguments.length > 1 ? defaultValue : fetchValue;
};

/**
* @function {prettify} Capitalize the first letter of the first word, or optionally capitalize
* the first letter of every word if *allWords* argument is **true**
* @param {String} {str} String to modify
* @param {Boolean} {[allWords=false]} If **true**, capitalize the first letter of EVERY word (instead of just the first)
* @return {String} A prettified string
*/
function prettify(tempStr, allWords) {
  if (root.noe(tempStr)) return '';

  if (allWords) {
    return ('' + tempStr).toLowerCase().replace(/\b(\w)/gi, function (a, x) {
      return '' + x.toUpperCase();
    });
  } else {
    return ('' + tempStr).replace(/^([^\w]*)(\w)(\w+)?/gi, function (a, x, y, z) {
      var initial = x + y.toUpperCase();return z ? initial + z.toLowerCase() : initial;
    });
  }
}

/**
* @function {equal} Deep compare two or more objects against each other to see if they are equal or not
* @param {*} {...args} Arguments to compare
* @return {Boolean} True if objects are equal / false otherwise
* @note If an object doesn't have the default Object.prototype.constructor (isn't a plain object) then the object is tested for strict equality and the .toString() between both objects is compared
**/
function equal(obj) {
  function compare(obj1, obj2, alreadyVisited) {
    if (obj1 === obj2) return true;

    if (instanceOf(obj1, 'string') && instanceOf(obj2, 'string')) return obj1.toString() === obj2.toString();

    if (instanceOf(obj1, 'number') && instanceOf(obj2, 'number')) {
      if (isNaN(obj1) && isNaN(obj2)) return true;

      if (!isFinite(obj1) && !isFinite(obj2)) return true;

      //Not triple equals because we are also testing Number instances
      return obj1 == obj2;
    }

    if (instanceOf(obj1, 'boolean') && instanceOf(obj2, 'boolean')) return obj1 == obj2; //Not triple equals because we are also testing Boolean instances

    if ((typeof obj1 === 'undefined' ? 'undefined' : _typeof(obj1)) !== (typeof obj2 === 'undefined' ? 'undefined' : _typeof(obj2))) {
      console.log('Type is not equal: ', obj1, obj2);
      return false;
    }

    if (obj1 === undefined && obj2 === undefined) return true;

    if (obj1 === null && obj2 === null) return true;

    if (instanceOf(obj1, 'array') && instanceOf(obj2, 'array')) {
      if (obj1.length !== obj2.length) {
        console.log('Array length is not equal');
        return false;
      }

      if (obj1.length === 0) return true;

      for (var i = 0, il = obj1.length; i < il; i++) {
        if (!compare(obj1[i], obj2[i], alreadyVisited)) return false;
      }

      return true;
    }

    if (obj1.constructor !== Object.prototype.constructor || obj2.constructor !== Object.prototype.constructor) return obj1.toString() === obj2.toString();

    var keys1 = Object.keys(obj1),
        keys2 = Object.keys(obj2);

    if (keys1.length !== keys2.length) return false;

    if (!compare(keys1, keys2, alreadyVisited)) return false;

    for (var i = 0, il = keys1.length; i < il; i++) {
      var key = keys1[i],
          value1 = obj1[key],
          value2 = obj2[key];

      if (value1 === undefined && value2 === undefined) continue;

      if (value1 === null && value2 === null) continue;

      if (instanceOf(value1, 'string', 'number', 'boolean')) {
        if (!compare(value1, value2)) return false;
      } else {
        if (alreadyVisited.indexOf(value1) >= 0) continue;

        alreadyVisited.push(value1);
        if (!compare(value1, value2, alreadyVisited)) return false;
      }
    }

    return true;
  }

  for (var i = 1, il = arguments.length; i < il; i++) {
    var arg = arguments[i];
    if (!compare(obj, arg, [])) return false;
  }

  return true;
}

//The format is like so: formatFunc1,formatFunc2(myArg:true),formatFunc3(intArg:6),formatFunc4(strArg:hello world)
function getFunctionsAndArguments(str) {
  var funcList = [];

  //We aren't actually replacing anything
  //this is a trick to run a function on each regex match
  var funcs = str.replace(/\s*(\w+)\s*(\([^\\\)]*(?:\\.[^\\\)]*)*?\))?\s*/g, function (match, name, args) {
    var currentFunc = {
      name: name,
      args: {}
    };

    if (args) {
      var funcArgs = {};
      args.replace(/\((.*)\)/g, function (match, args) {
        args.replace(/\\\)/g, ')').replace(/\s*(\w+)\s*:\s*([^\\,]*(?:\\.[^\\,]*)*)\s*/g, function (match, name, _value) {
          var value = _value.replace(/\\(.)/g, '$1'),
              num = parseFloat(value),
              finalValue = value;

          if (!isNaN(num) && isFinite(num)) finalValue = num;else if (value.match(/(true|false)/i)) finalValue = value.toLowerCase() === 'true';

          funcArgs[name] = finalValue;
        });
      });

      currentFunc.args = funcArgs;
    }

    funcList.push(currentFunc);
  });

  return funcList;
}

//Create a chain of formatter / validator functions
function formatterValidatorChainFactory(funcPool, _funcs, _args) {
  var self = this,
      funcs = _funcs,
      args = _args;

  if (!funcs) {
    funcs = [function (v, o, a) {
      if (o === 'validate') return;
      return v;
    }];
  } else if (instanceOf(funcs, 'string', 'array')) {
    if (!(funcs instanceof Array)) funcs = [funcs];

    var finalFuncs = [];
    for (var i = 0, il = funcs.length; i < il; i++) {
      var func = funcs[i];
      if (instanceOf(func, 'string')) {
        var parsedFuncs = getFunctionsAndArguments(func);
        for (var j = 0, jl = parsedFuncs.length; j < jl; j++) {
          var thisFunc = parsedFuncs[j],
              actualFunc = funcPool[thisFunc.name];

          if (actualFunc instanceof Function) {
            (function (name, funcArgs, func) {
              finalFuncs.push(function (val, op, args) {
                var thisArgs = Object.assign({}, funcArgs, args),
                    ret;

                try {
                  ret = func.call(this, val, op, thisArgs);
                } catch (e) {
                  ret = e;
                }

                return {
                  args: thisArgs,
                  value: ret
                };
              });
            })(thisFunc.name, thisFunc.args, actualFunc);
          }
        }
      } else if (func instanceof Function) {
        finalFuncs.push(func);
      }
    }

    funcs = finalFuncs;
  } else if (instanceOf(funcs, 'function')) {
    funcs = [funcs];
  } else {
    throw 'Error: Arguments not supported';
  }

  return function (val, op, userArgs) {
    function doNextFunc(val, op, formatterArgs, funcArgs, index, resolve, reject) {
      if (index >= funcs.length) {
        if (op === 'validate') {
          resolve([val, op, funcArgs]);
          return;
        } else {
          return val;
        }
      }

      var func = funcs[index],
          funcRet = func.apply(this, [val, op, formatterArgs]),
          funcArgs = funcRet.args,
          ret = funcRet.value;

      if (op === 'validate' && ret) {
        if (instanceOf(ret, 'deferred')) {
          ret.then(function () {
            doNextFunc.call(this, val, op, formatterArgs, funcArgs, index + 1, resolve, reject);
          }, function error() {
            for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
              args[_key] = arguments[_key];
            }

            reject([].concat(args, [val, op, funcArgs]));
          });
        } else {
          reject({ error: ret, args: [val, op, funcArgs] });
        }

        return;
      } else if (op !== 'validate' && ret !== undefined) val = ret;

      return doNextFunc.call(this, val, op, formatterArgs, funcArgs, index + 1, resolve, reject);
    }

    var formatterArgs = Object.assign({}, userArgs, args);
    if (op === 'validate') {
      return new Promise(function (resolve, reject) {
        doNextFunc.call(this, val, op, formatterArgs, formatterArgs, 0, resolve, reject);
      });
    } else {
      return doNextFunc.call(this, val, op, formatterArgs, formatterArgs, 0);
    }
  };
}

root.getFunctionsAndArguments = getFunctionsAndArguments;
root.formatterValidatorChainFactory = formatterValidatorChainFactory;
/**
* @function get Get a property from an object and all sub-objects by evaluating a dot-notation path into an object.
* @param {Object} {obj} Object to get property from
* @param {String} {path} Dot notation path to evaluate
* @param {*} {[defaultValue=undefined]} Specify a default value to return if the requested property is not found, is null, undefined, NaN or !isFinite
* @return {*} Return property specified by path
* @see function:set
* @example {javascript}
	var obj = {hello: {world: "!!!"}, arr:[[1,2],3,4,5]};
	utils.get(obj, 'hello.world'); //!!!
	utils.get(obj, "some.key.that.doesn't.exist", 'not found'); //not found
	utils.get(obj, "arr[0][0]"); //1
	utils.get(obj, "arr[1]"); //3
**/
root.get = prop.bind(root, 'get');

/**
* @function set Set a property on an object by evaluating a dot-notation path into an object.
* @param {Object} {obj} Object to set property on
* @param {String} {path} Dot notation path to evaluate
* @param {*} {value} Value to set
* @return {String} Return the actual final path (relative to the base object) where the property was set. This is useful if property was pushed into an array; the actual array index will be returned as part of the final path
* @see get
* @note With empty array notation in a specified path (i.e my.array.key[]) the value will be appended to the array specified
* @example {javascript}
	var obj = {};
	utils.set(obj, 'hello.world', '!!!'); //hello.world
	utils.set(set, "arr[]", [1]); //arr[0]
	utils.set(obj, "arr[0][1]", 2); //arr[0][1]
	utils.set(obj, "arr[]", 3); //arr[1]
**/
root.set = prop.bind(root, 'set');

/**
* @function remove Remove a property from an object/sub-object by evaluating a dot-notation path into an object.
* @param {Object} {obj} Object to remove property from
* @param {String} {path} Dot notation path to evaluate
* @return {*} Return property value of removed key specified by path
* @see get
* @example {javascript}
	var obj = {hello: {world: "!!!"}, arr:[[1,2],3,4,5]};
	utils.remove(obj, 'hello.world'); //obj === {hello: {}, arr:[[1,2],3,4,5]}
**/
root.remove = prop.bind(root, 'remove');

/**
* @function getMeta Get a meta property from an object and all sub-objects by evaluating a dot-notation path into an object. This is the same as @@get except it is used for object meta properties
* @param {Object} {obj} Object to get meta property from
* @param {String} {path} Dot notation path to evaluate
* @param {*} {[defaultValue=undefined]} Specify a default value to return if the requested meta property is not found, is null, undefined, NaN or !isFinite
* @return {*} Return property specified by path
* @see setMeta
**/
root.getMeta = prop.bind(root, 'getMeta');

/**
* @function setMeta Set a meta property on an object by evaluating a dot-notation path into an object. This is the same as @@set except it is used for object meta properties
* @param {Object} {obj} Object to set meta property on
* @param {String} {path} Dot notation path to evaluate
* @param {*} {value} Value to set
* @return {String} Return the actual final path (relative to the base object) where the meta property was set. This is useful if meta property was pushed into an array; the actual array index will be returned as part of the final path
* @see getMeta
**/
root.setMeta = prop.bind(root, 'setMeta');

/**
* @function removeMeta Remove a meta property from an object/sub-objects by evaluating a dot-notation path into an object. This is the same as @@remove except it is used for object meta properties
* @param {Object} {obj} Object to remove meta property from
* @param {String} {path} Dot notation path to evaluate
* @return {*} Return property value of removed key specified by path
* @see setMeta
**/
root.removeMeta = prop.bind(root, 'removeMeta');

/**
* @function getMetaNS Get a namespaced meta property from an object and all sub-objects by evaluating a dot-notation path into an object. This is the same as @@getMeta except that the value is retrieved from a namespace
* @param {Object} {obj} Object to get meta property from
* @param {String} {namespace} Namespace to store meta property in
* @param {String} {path} Dot notation path to evaluate
* @param {*} {[defaultValue=undefined]} Specify a default value to return if the requested meta property is not found, is null, undefined, NaN or !isFinite
* @return {*} Return property specified by path
* @see getMeta
* @see setMeta
**/
root.getMetaNS = prop.bind(root, 'getMetaNS');

/**
* @function setMetaNS Set a namespaced meta property on an object by evaluating a dot-notation path into an object. This is the same as @@setMeta except that the value is stored in a namespace
* @param {Object} {obj} Object to set meta property on
* @param {String} {namespace} Namespace to store meta property in
* @param {String} {path} Dot notation path to evaluate
* @param {*} {value} Value to set
* @return {String} Return the actual final path (relative to the base object) where the meta property was set. This is useful if meta property was pushed into an array; the actual array index will be returned as part of the final path
* @see getMeta
**/
root.setMetaNS = prop.bind(root, 'setMetaNS');

/**
* @function removeMetaNS Remove a namespaced meta property from an object/sub-objects by evaluating a dot-notation path into an object. This is the same as @@removeMeta except that the value is retrieved from a namespace
* @param {Object} {obj} Object to remove meta property from
* @param {String} {namespace} Namespace to remove meta property in
* @param {String} {path} Dot notation path to evaluate
* @return {*} Return property value of removed key specified by path
* @see removeMeta
**/
root.removeMetaNS = prop.bind(root, 'removeMetaNS');

/**
* @function uuid Generate a random UUID
* @return {String} Return randomly generated UUID
**/
function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    var r = Math.random() * 16 | 0,
        v = c == 'x' ? r : r & 0x3 | 0x8;
    return v.toString(16);
  });
}

// Safely serialize possibly cyclic JSON
function safeJSONStringify(obj, formatter, space) {
  function safeCloneObj(key, value, _alreadyVisited) {
    if (!value) return value;

    if (typeof value === 'string' || value instanceof String || typeof value === 'number' || value instanceof Number || typeof value === 'boolean' || value instanceof Boolean) return value.valueOf();

    var alreadyVisited = _alreadyVisited || [],
        index = alreadyVisited.findIndex(function (obj) {
      return obj.oldValue === value;
    });

    // Has this value already been stored (cyclic)?
    if (index >= 0) return '::@' + index + '@::';

    var keys = Object.keys(value),
        valueCopy = value instanceof Array ? new Array(value.length) : {};

    index = alreadyVisited.length;
    alreadyVisited.push({
      referenced: false,
      newValue: valueCopy,
      oldValue: value
    });

    for (var i = 0, il = keys.length; i < il; i++) {
      var key = keys[i],
          thisValue = safeCloneObj(key, value[key], alreadyVisited);

      valueCopy[key] = thisValue;
    }

    return {
      '::@id@::': index,
      value: valueCopy
    };
  }

  var alreadyVisited = [],
      newObj = safeCloneObj(null, obj, alreadyVisited);

  return JSON.stringify(newObj, formatter, space);
}

// Safely parse possibly cyclic JSON
function safeJSONParse(data) {
  // Build references to all objects... later to be used to rebuild cyclic object
  function buildRefs(key, obj, _refs) {
    if (!obj) return obj;

    if (!obj.hasOwnProperty('::@id@::')) return obj;

    var refs = _refs || {},
        id = obj['::@id@::'],
        value = obj.value,
        keys = Object.keys(value),
        newObj = value instanceof Array ? new Array(value.length) : {};

    refs[id] = newObj;
    for (var i = 0, il = keys.length; i < il; i++) {
      var key = keys[i];
      if (key.match(/::@(id|\d+)@::/)) continue;

      var thisValue = buildRefs(key, value[key], refs);
      newObj[key] = thisValue;
    }

    return newObj;
  }

  // Reconstruct cyclic object
  function unwindData(key, obj, refs) {
    if (!obj) return obj;

    if (typeof obj === 'string') {
      var p = obj.match(/::@(\d)+@::/);
      if (!p) return obj;

      var index = p[1];
      return unwindData(key, refs[index], refs);
    }

    if (!obj.hasOwnProperty('::@id@::')) return obj;

    var id = obj['::@id@::'],
        value = obj.value,
        keys = Object.keys(value),
        newObj = refs[id];

    for (var i = 0, il = keys.length; i < il; i++) {
      var key = keys[i];
      if (key.match(/::@(id|\d+)@::/)) continue;

      var thisValue = unwindData(key, value[key], refs);
      newObj[key] = thisValue;
    }

    return newObj;
  }

  // Safety checks
  if (data === undefined || data === '') return;

  if (data === "null" || data === null) return null;

  try {
    // Parse JSON
    var obj = JSON.parse(data);

    // If it is simple, just return the value
    if (typeof obj === 'string' || typeof obj === 'number' || typeof obj === 'boolean' || obj instanceof Array) return obj;

    // Build object reference table
    var refs = {};
    buildRefs(null, obj, refs);

    // Reconstruct data
    return unwindData(null, obj, refs);
  } catch (e) {
    return;
  }
}

root.expectType = expectType;
root.uuid = uuid;
root.equal = equal;
root.id = id;
root.aliases = aliases;
root.audit = audit;
root.empty = empty;
root.instanceOf = instanceOf;
root.sizeOf = sizeOf;
root.noe = noe;
root.prettify = prettify;
root.safeJSONStringify = safeJSONStringify;
root.safeJSONParse = safeJSONParse;
root.firstOf = firstOf;
root.lastOf = lastOf;

root.defineROProperty = defineROProperty;
root.defineRWProperty = defineRWProperty;

module.exports = Object.assign(module.exports, root);