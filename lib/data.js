// (c) 2017 Wyatt Greenway - devoir
// This code is licensed under MIT license (see LICENSE.txt for details)
// Use unrestricted with the permission of the author

'use strict';

/**
	* @namespace {evisit-core-js}
	* @namespace {data}
	*/

import { get as getProp, set as setProp, now, instanceOf, defineRWProperty } from './utils';

const root = {};

/**
* @function {extend} Extend (copy) objects into base object. This should ALWAYS be used instead of jQuery.extend
	because it is faster, and more importantly because it WILL NOT mangle instantiated
	sub-objects.
* @param {[flags]} 
* 	@type {Object} Will be considered the first of <b>args</b>
*		@type {Boolean} If true this is a deep copy
*		@type {Number} This is a bitwise combination of flags. Flags include: evisit-core-js.data.extend.DEEP, evisit-core-js.data.extend.NO_OVERWRITE, and evisit-core-js.data.extend.FILTER. If the 'FILTER' flag is specified the 2nd argument is expected to be a function to assist in which keys to copy
*	@end
* @param {[args...]} 
* 	@type {Object} Objects to copy into base object. First object in the argument list is the base object.
*		@type {Function} If the second argument is a function and the bitwise flag "FILTER" is set then this function will be the callback used to filter the keys of objects during copy
			@param {String} {key} Key of object(s) being copied
			@param {*} {value} Value being copied
			@param {Object} {src} Parent Object/Array where value is being copied from
			@param {*} {dstValue} Value of same key at destination, if any
			@param {Object} {dst} Parent Object/Array where value is being copied to
		@end
*	@end
* @return {Object} Base object with all other objects merged into it
*/
function extend() {
	if (arguments.length === 0)
		return;

	if (arguments.length === 1)
		return arguments[0];

	var isDeep = false;
	var allowOverwrite = true;
	var onlyMatching = false;
	var filterFunc;
	var startIndex = 0;
	var dst = arguments[0];

	if (typeof dst === 'boolean') {
		isDeep = dst;
		startIndex++;
	} else if (typeof dst === 'number') {
		isDeep = (dst & extend.DEEP);
		allowOverwrite = !(dst & extend.NO_OVERWRITE);
		startIndex++;
		filterFunc = (dst & extend.FILTER) ? arguments[startIndex++] : undefined;
	}

	//Destination object
	dst = arguments[startIndex++];
	if (!dst)
		dst = {};

	var val;
	if (isDeep) {
		for (var i = startIndex, len = arguments.length; i < len; i++) {
			var thisArg = arguments[i];
			if (!(thisArg instanceof Object))
				continue;

			var keys = Object.keys(thisArg);
			for (var j = 0, jLen = keys.length; j < jLen; j++) {
				var key = keys[j];

				if (allowOverwrite !== true && dst.hasOwnProperty(key))
					continue;

				val = thisArg[key];
				var dstVal = dst[key];

				if (filterFunc && filterFunc(key, val, thisArg, dstVal, dst) === false)
					continue;

				if (val && typeof val === 'object' && !(val instanceof String) && !(val instanceof Number) &&
						(val.constructor === Object.prototype.constructor || val.constructor === Array.prototype.constructor)) {
					var isArray = (val instanceof Array);
					if (!dstVal)
						dstVal = (isArray) ? [] : {};
					val = extend(true, (isArray) ? [] : {}, dstVal, val);
				}

				dst[key] = val;
			}
		}
	} else {
		for (var i = startIndex, len = arguments.length; i < len; i++) {
			var thisArg = arguments[i];
			if (!(thisArg instanceof Object))
				continue;

			var keys = Object.keys(thisArg);
			for (var j = 0, jLen = keys.length; j < jLen; j++) {
				var key = keys[j];

				if (allowOverwrite !== true && dst.hasOwnProperty(key))
					continue;

				val = thisArg[key];
				if (filterFunc) {
					var dstVal = dst[key];
					if (filterFunc(key, val, thisArg, dstVal, dst) === false)
						continue;
				}

				dst[key] = val;
			}
		}
	}

	if (dst._audit) {
  	var b = dst._audit.base;
    b.modified = now();
    b.updateCount++;
	}

	return dst;
}
root.extend = extend;

(function extend_const(base) {
	base.DEEP = 0x01;
	base.NO_OVERWRITE = 0x02;
	base.FILTER = 0x04;
})(extend);

/**
* @function {extract} Extracts elements from an Array of Objects (not parts from a String). This is not the same as @@@function:evisit-core-js.utils.extract
* @param {String} {key} Key to extract from all objects
* @param {Object} {[args...]} Array(s) to extract from
* @return {Object} Array of extracted properties. If the property wasn't found the array element will be 'undefined'.
* @see function:evisit-core-js.data.toLookup
* @example {javascript}
	var myParts = extract('id', [
		{
			id:'derp',
			field: 'derp'
		},
		{
			id:'dog',
			field: 'dog'
		},
		{
			id:'cat',
			field: 'cat'
		}
	], [
		{
			id:'another',
			field: 'another'
		},
		{
			id:'field',
			field: 'field'
		}
	]);

	myParts === ['derp','dog','cat','another','field'];
*/
function extract(key) {
	var thisArray = [];
	for (var i = 1, len = arguments.length; i < len; i++) {
		var args = arguments[i];
		if (!args)
			continue;

		for (var j in args) {
			if (!args.hasOwnProperty(j))
				continue;

			var val = getProp(args[j], key);
			thisArray.push(val);
		}
	}
	return thisArray;
}
root.extract = extract;

/**
* @function {toLookup} This takes an Array and returns a reference map for quick lookup.
* @param {String} {key} Key to match on all objects. If key is undefined or null, the index will be used instead.
* @param {Array} {data} Array to create map from
* @return {Object} Each key in the object will be the value in the Array specified by 'key'
* @see function:evisit-core-js.data.extract
* @example {javascript}
	var myMap = toLookup('id', [
		{
			id:'derp',
			field: 'derp'
		},
		{
			id:'dog',
			field: 'dog'
		},
		{
			id:'cat',
			field: 'cat'
		}
	]);

	myMap === {
		'derp': {
			id:'derp',
			field: 'derp'
		},
		'dog': {
			id:'dog',
			field: 'dog'
		},
		'cat': {
			id:'cat',
			field: 'cat'
		}
	};
*/
function toLookup(key, data) {
	if (!data)
		return {};

	var obj = {},
			keys = Object.keys(data);
	
	for (var i = 0, il = keys.length; i < il; i++) {
		var id,
				k = keys[i],
				v = data[k];

		if (key) {
			id = getProp(v, key);
		} else {
			id = ('' + v);
		}

		if (!id)
			continue;

		obj[id] = v;
	}

	return obj;
}
root.toLookup = toLookup;

const KEYS = 0x01,
      VALUES = 0x02;

function strip(type, ...args) {
  return this.filter((elem, key) => {
    for (var i = 0, il = args.length; i < il; i++) {
      var match = args[i],
          matchAgainst = (type === KEYS) ? key : elem;

      if (match instanceof RegExp)
        return !match.test(('' + matchAgainst));
      else if (match instanceof Function)
        return !match(matchAgainst);

      return !(match === matchAgainst);
    }
  });
}

class TranslatorEngine {
  constructor(baseData, newData) {
    defineRWProperty(this, '_data', baseData);
    defineRWProperty(this, '_currentData', newData);
  }

  value() {
    return this._currentData;
  }

  select() {
    var newData = [];
    for (var i = 0, il = arguments.length; i < il; i++) {
      var thisData = arguments[i];
      if (typeof thisData === 'string')
        thisData = getProp(this._data, thisData);

      newData.push(thisData);
    }

    if (arguments.length === 0)
      newData = this._currentData;
    else if (arguments.length === 1)
      newData = newData[0];

    return new TranslatorEngine(this._data, newData, this);
  }

  filter(_func) {
    var func = _func,
        d = this._currentData;

    if (!d || instanceOf(d, 'string', 'number', 'boolean', 'function'))
      return this;

    if (d instanceof Array) {
      if (!(func instanceof Function)) {
        func = (elem) => {
          return (elem !== null && elem !== undefined);
        };
      }
        
      return new TranslatorEngine(this._data, d.filter(func.bind(this)), this._previous);
    } else {
      if (!func) {
        func = (elem, index) => {
          return (elem !== null && elem !== undefined);
        };
      }

      var finalObj = {},
          keys = Object.keys(d);

      for (var i = 0, il = keys.length; i < il; i++) {
        var key = keys[i],
            val = d[key];

        if (func.call(this, val, key, d) !== true)
          continue;

        finalObj[key] = val;
      }

      return new TranslatorEngine(this._data, finalObj, this._previous);
    }
  }

  reset() {
    return new TranslatorEngine(this._data, this._currentData, this._previous);
  }

  stripKeys(...args) {
    return strip.call(this, KEYS, ...args);
  }

  stripValues(...args) {
    return strip.call(this, VALUES, ...args);
  }

  map(_func) {
    var func = _func,
        d = this._currentData;
    
    if (!d || !(func instanceof Function))
      return this;

    if (d instanceof Array) {
      return new TranslatorEngine(this._data, d.map(func, this), this._previous);
    } else if (!instanceOf(d, 'string', 'number', 'boolean', 'function')) {
      var finalObj = {},
          keys = Object.keys(d);

      for (var i = 0, il = keys.length; i < il; i++) {
        var key = keys[i],
            val = d[key],
            newVal = func.call(this, val, key, d);

        finalObj[key] = newVal;
      }

      return new TranslatorEngine(this._data, finalObj, this._previous);
    }
  }

  reduce(_func, start) {
    var func = _func,
        d = this._currentData;
    
    if (!d || !(func instanceof Function))
      return this;

    if (d instanceof Array) {
      return new TranslatorEngine(this._data, d.reduce.call(this, func, start), this._previous);
    } else if (!instanceOf(d, 'string', 'number', 'boolean', 'function')) {
      var finalObj = start || {},
          keys = Object.keys(d);

      for (var i = 0, il = keys.length; i < il; i++) {
        var key = keys[i],
            val = d[key];

        finalObj = func.call(this, val, key, finalObj, d);
      }

      return new TranslatorEngine(this._data, finalObj, this._previous);
    }
  }

  unwrap() {
    var d = this._currentData,
        finalObj = {};

    for (var i = 0, il = d.length; i < il; i++) {
      for (var j = 0, jl = arguments.length; j < jl; j++) {
        var path = arguments[j],
            val = d[i],
            key = getProp(val, path);

        if (!instanceOf(key, 'string', 'number', 'boolean'))
          continue;

        key = ('' + key);
        var currentVal = finalObj[key] || ((val instanceof Array) ? [] : {});

        if (currentVal instanceof Array)
          finalObj[key] = currentVal.concat(val);
        else
          finalObj[key] = extend(true, currentVal, val);
      }
    }

    return new TranslatorEngine(this._data, finalObj, this._previous);
  }

  wrap() {
    var d = this._currentData;
    if (!d || instanceOf(d, 'string', 'number', 'boolean', 'function'))
      return this;

    var keys = Object.keys(d),
        finalObj = [];

    for (var i = 0, il = keys.length; i < il; i++) {
      var val = d[keys[i]];
      if (finalObj.indexOf(val) < 0)
        finalObj.push(val);
    }

    return new TranslatorEngine(this._data, finalObj, this._previous);
  }

  collapse(path) {
    return this.unwrap(path).wrap();
  }

  join() {
    var finalObj = (this._currentData instanceof Array) ? this._currentData : [];
    for (var i = 0, il = arguments.length; i < il; i++) {
      var path = arguments[i],
          val = getProp(this._data, path);
      finalObj = finalObj.concat(val);
    }

    return new TranslatorEngine(this._data, finalObj, this._previous);
  }

  merge() {
    var d = this._currentData,
        finalObj = (d instanceof Array) ? [] : {};

    for (var i = 0, il = arguments.length; i < il; i++) {
      var path = arguments[i],
          val = getProp(this._data, path);

      if (d instanceof Array) {
        finalObj = finalObj.concat(val);
      } else if (val && !instanceOf(val, 'string', 'number', 'boolean', 'array', 'function')) {
        finalObj = extend(finalObj, val);
      }
    }

    return new TranslatorEngine(this._data, finalObj, this._previous);
  }

  extract(path) {
    var d = this._currentData;

    if (!d || instanceOf(d, 'string', 'number', 'boolean', 'function'))
      return this;

    var finalObj = [],
        keys = Object.keys(d);

    for (var i = 0, il = keys.length; i < il; i++) {
      var key = keys[i],
          val = getProp(d[key], path);

      finalObj.push(val);
    }

    return new TranslatorEngine(this._data, finalObj, this._previous);
  }

  mutate(fieldFrom, _fieldTo, _func) {
    var fieldTo = (arguments.length === 2) ? fieldFrom : _fieldTo,
        func = (arguments.length === 2) ? _fieldTo : _func,
        d = this._currentData,
        val = func(getProp(d, fieldFrom));

    if (val !== undefined)
      setProp(d, fieldTo, val);

    return new TranslatorEngine(this._data, d, this._previous);
  }

  createTranslator(func, ...args) {
    var self = this;
    return function(elem) {
      var e = new TranslatorEngine(self.data, elem);
      return e[func].apply(e, args).value();
    };
  }
}
root.TranslatorEngine = TranslatorEngine;

module.exports = Object.assign(module.exports, root);
