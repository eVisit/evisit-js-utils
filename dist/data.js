// (c) 2017 Wyatt Greenway - devoir
// This code is licensed under MIT license (see LICENSE.txt for details)
// Use unrestricted with the permission of the author

'use strict';

/**
	* @namespace {evisit-core-js}
	* @namespace {data}
	*/

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _utils = require('./utils');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var root = {};

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
  function _extend(parentKey, parentObj, depth, dst) {
    var val,
        startIndex = 4;

    if (isDeep) {
      for (var i = startIndex, len = arguments.length; i < len; i++) {
        var thisArg = arguments[i];
        if (!thisArg) continue;

        if (!(thisArg instanceof Object)) continue;

        var keys = Object.keys(thisArg);
        for (var j = 0, jLen = keys.length; j < jLen; j++) {
          var key = keys[j];
          if (key === '__proto__' || key === 'constructor' || key === 'prototype') continue;

          if (allowOverwrite !== true && dst.hasOwnProperty(key)) continue;

          val = thisArg[key];
          var dstVal = dst[key];

          if (filterFunc && filterFunc(key, val, thisArg, dstVal, dst, depth, parentKey, parentObj) === false) continue;

          if (val && (typeof val === 'undefined' ? 'undefined' : _typeof(val)) === 'object' && !(val instanceof String) && !(val instanceof Number) && (val.constructor === Object.prototype.constructor || val.constructor === Array.prototype.constructor)) {
            var isArray = val instanceof Array;
            if (!dstVal) dstVal = isArray ? [] : {};
            val = _extend(key, thisArg, depth + 1, isArray ? [] : {}, dstVal, val);
          }

          dst[key] = val;
        }
      }
    } else {
      for (var i = startIndex, len = arguments.length; i < len; i++) {
        var thisArg = arguments[i];
        if (!thisArg) continue;

        if (!(thisArg instanceof Object)) continue;

        var keys = Object.keys(thisArg);
        for (var j = 0, jLen = keys.length; j < jLen; j++) {
          var key = keys[j];
          if (key === '__proto__' || key === 'constructor' || key === 'prototype') continue;

          if (allowOverwrite !== true && dst.hasOwnProperty(key)) continue;

          val = thisArg[key];
          if (filterFunc) {
            var dstVal = dst[key];
            if (filterFunc(key, val, thisArg, dstVal, dst, depth, parentKey, parentObj) === false) continue;
          }

          dst[key] = val;
        }
      }
    }

    if (dst._audit) {
      var b = dst._audit.base;
      b.modified = (0, _utils.now)();
      b.updateCount++;
    }

    return dst;
  };

  if (arguments.length === 0) return;

  if (arguments.length === 1) return arguments[0];

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
    isDeep = dst & extend.DEEP;
    allowOverwrite = !(dst & extend.NO_OVERWRITE);
    startIndex++;
    filterFunc = dst & extend.FILTER ? arguments[startIndex++] : undefined;
  }

  //Destination object
  dst = arguments[startIndex++];
  if (!dst) dst = {};

  var args = [null, null, 0, dst];
  for (var i = startIndex, il = arguments.length; i < il; i++) {
    args.push(arguments[i]);
  }return _extend.apply(this, args);
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
    if (!args) continue;

    for (var j in args) {
      if (!args.hasOwnProperty(j)) continue;

      var val = (0, _utils.get)(args[j], key);
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
  if (!data) return {};

  var obj = {},
      keys = Object.keys(data);

  for (var i = 0, il = keys.length; i < il; i++) {
    var id,
        k = keys[i],
        v = data[k];

    if (key) {
      id = (0, _utils.get)(v, key);
    } else {
      id = '' + v;
    }

    if (!id) continue;

    obj[id] = v;
  }

  return obj;
}
root.toLookup = toLookup;

function clone(val) {
  if (val instanceof Array) return val.slice();else if (val instanceof String || val instanceof Number || val instanceof Boolean) return val.valueOf();else if (val && val instanceof Object && val.constructor === Object.prototype.constructor) return Object.assign({}, val);

  return val;
}

root.clone = clone;

var KEYS = 0x01,
    VALUES = 0x02;

function strip(type) {
  for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    args[_key - 1] = arguments[_key];
  }

  return this.filter(function (elem, key) {
    for (var i = 0, il = args.length; i < il; i++) {
      var match = args[i],
          matchAgainst = type === KEYS ? key : elem;

      if (match instanceof RegExp) return !match.test('' + matchAgainst);else if (match instanceof Function) return !match(matchAgainst);

      return !(match === matchAgainst);
    }
  });
}

var TranslatorEngine = function () {
  function TranslatorEngine(baseData, newData) {
    _classCallCheck(this, TranslatorEngine);

    (0, _utils.defineRWProperty)(this, '_data', baseData);
    (0, _utils.defineRWProperty)(this, '_currentData', newData);
  }

  _createClass(TranslatorEngine, [{
    key: 'value',
    value: function value() {
      return this._currentData;
    }
  }, {
    key: 'select',
    value: function select() {
      var newData = [];
      for (var i = 0, il = arguments.length; i < il; i++) {
        var thisData = arguments[i];
        if (typeof thisData === 'string') thisData = (0, _utils.get)(this._data, thisData);

        newData.push(thisData);
      }

      if (arguments.length === 0) newData = this._currentData;else if (arguments.length === 1) newData = newData[0];

      return new TranslatorEngine(this._data, newData, this);
    }
  }, {
    key: 'filter',
    value: function filter(_func) {
      var func = _func,
          d = this._currentData;

      if (!d || (0, _utils.instanceOf)(d, 'string', 'number', 'boolean', 'function')) return this;

      if (d instanceof Array) {
        if (!(func instanceof Function)) {
          func = function func(elem) {
            return elem !== null && elem !== undefined;
          };
        }

        return new TranslatorEngine(this._data, d.filter(func.bind(this)), this._previous);
      } else {
        if (!func) {
          func = function func(elem, index) {
            return elem !== null && elem !== undefined;
          };
        }

        var finalObj = {},
            keys = Object.keys(d);

        for (var i = 0, il = keys.length; i < il; i++) {
          var key = keys[i],
              val = d[key];

          if (func.call(this, val, key, d) !== true) continue;

          finalObj[key] = val;
        }

        return new TranslatorEngine(this._data, finalObj, this._previous);
      }
    }
  }, {
    key: 'reset',
    value: function reset() {
      return new TranslatorEngine(this._data, this._currentData, this._previous);
    }
  }, {
    key: 'stripKeys',
    value: function stripKeys() {
      for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
        args[_key2] = arguments[_key2];
      }

      return strip.call.apply(strip, [this, KEYS].concat(args));
    }
  }, {
    key: 'stripValues',
    value: function stripValues() {
      for (var _len3 = arguments.length, args = Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
        args[_key3] = arguments[_key3];
      }

      return strip.call.apply(strip, [this, VALUES].concat(args));
    }
  }, {
    key: 'map',
    value: function map(_func) {
      var func = _func,
          d = this._currentData;

      if (!d || !(func instanceof Function)) return this;

      if (d instanceof Array) {
        return new TranslatorEngine(this._data, d.map(func, this), this._previous);
      } else if (!(0, _utils.instanceOf)(d, 'string', 'number', 'boolean', 'function')) {
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
  }, {
    key: 'reduce',
    value: function reduce(_func, start) {
      var func = _func,
          d = this._currentData;

      if (!d || !(func instanceof Function)) return this;

      if (d instanceof Array) {
        return new TranslatorEngine(this._data, d.reduce(func, start), this._previous);
      } else if (!(0, _utils.instanceOf)(d, 'string', 'number', 'boolean', 'function')) {
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
  }, {
    key: 'unwrap',
    value: function unwrap() {
      var d = this._currentData,
          finalObj = {};

      for (var i = 0, il = d.length; i < il; i++) {
        for (var j = 0, jl = arguments.length; j < jl; j++) {
          var path = arguments[j],
              val = d[i],
              key = (0, _utils.get)(val, path);

          if (!(0, _utils.instanceOf)(key, 'string', 'number', 'boolean')) continue;

          key = '' + key;
          var currentVal = finalObj[key] || (val instanceof Array ? [] : {});

          if (currentVal instanceof Array) finalObj[key] = currentVal.concat(val);else finalObj[key] = extend(true, currentVal, val);
        }
      }

      return new TranslatorEngine(this._data, finalObj, this._previous);
    }
  }, {
    key: 'wrap',
    value: function wrap() {
      var d = this._currentData;
      if (!d || (0, _utils.instanceOf)(d, 'string', 'number', 'boolean', 'function')) return this;

      var keys = Object.keys(d),
          finalObj = [];

      for (var i = 0, il = keys.length; i < il; i++) {
        var val = d[keys[i]];
        if (finalObj.indexOf(val) < 0) finalObj.push(val);
      }

      return new TranslatorEngine(this._data, finalObj, this._previous);
    }
  }, {
    key: 'collapse',
    value: function collapse(path) {
      return this.unwrap(path).wrap();
    }
  }, {
    key: 'join',
    value: function join() {
      var finalObj = this._currentData instanceof Array ? this._currentData : [];
      for (var i = 0, il = arguments.length; i < il; i++) {
        var path = arguments[i],
            val = typeof path === 'string' ? (0, _utils.get)(this._data, path) : path;
        finalObj = finalObj.concat(val);
      }

      return new TranslatorEngine(this._data, finalObj, this._previous);
    }
  }, {
    key: 'merge',
    value: function merge() {
      var d = this._currentData,
          finalObj = d instanceof Array ? [] : {};

      for (var i = 0, il = arguments.length; i < il; i++) {
        var path = arguments[i],
            val = typeof path === 'string' ? (0, _utils.get)(this._data, path) : path;

        if (d instanceof Array) {
          finalObj = finalObj.concat(val);
        } else if (val && !(0, _utils.instanceOf)(val, 'string', 'number', 'boolean', 'array', 'function')) {
          finalObj = extend(finalObj, val);
        }
      }

      return new TranslatorEngine(this._data, finalObj, this._previous);
    }
  }, {
    key: 'extract',
    value: function extract(path) {
      var d = this._currentData;

      if (!d || (0, _utils.instanceOf)(d, 'string', 'number', 'boolean', 'function')) return this;

      var finalObj = [],
          keys = Object.keys(d);

      for (var i = 0, il = keys.length; i < il; i++) {
        var key = keys[i],
            val = (0, _utils.get)(d[key], path);

        finalObj.push(val);
      }

      return new TranslatorEngine(this._data, finalObj, this._previous);
    }
  }, {
    key: 'mutate',
    value: function mutate(fieldFrom, _fieldTo, _func) {
      var fieldTo = arguments.length === 2 ? fieldFrom : _fieldTo,
          func = arguments.length === 2 ? _fieldTo : _func,
          d = this._currentData,
          val = func((0, _utils.get)(d, fieldFrom));

      if (val !== undefined) (0, _utils.set)(d, fieldTo, val);

      return new TranslatorEngine(this._data, d, this._previous);
    }
  }, {
    key: 'createTranslator',
    value: function createTranslator(func) {
      for (var _len4 = arguments.length, args = Array(_len4 > 1 ? _len4 - 1 : 0), _key4 = 1; _key4 < _len4; _key4++) {
        args[_key4 - 1] = arguments[_key4];
      }

      var self = this;
      return function (elem) {
        var e = new TranslatorEngine(self.data, elem);
        return e[func].apply(e, args).value();
      };
    }
  }]);

  return TranslatorEngine;
}();

root.TranslatorEngine = TranslatorEngine;

module.exports = Object.assign(module.exports, root);