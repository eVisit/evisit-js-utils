// (c) 2017 Wyatt Greenway
// This code is licensed under MIT license (see LICENSE.txt for details)
// Use unrestricted with the permission of the author

'use strict';
import utils from './utils';
import moment from 'moment';

// Formatter and validator functions
const formatters = {
  'prettify': function(val, op, args) {
    if (op === 'format') {
      if (utils.noe(val))
        return '';
      return utils.prettify(val, args.all);
    }

    return val;
  },
  'htmlSafe': function(val, op, args) {
    if (op == 'validate')
      return;

    if (val === null || val === undefined || typeof val != 'string')
      val = '';

    var thisStr = '' + val;
    if (thisStr.length === 0)
      return '';

    if (op == 'unformat') {
      return thisStr.replace(/\&\#60\;/g, '<').replace(/\&\#62\;/gi, '>');
    } else if (op == 'format' || op === 'display' || op === 'sort') {
      return thisStr.replace(/</g, '&#60;').replace(/>/gi, '&#62;');
    }
  },
  'default': function(val, op, args) {
    if (op !== 'validate')
      return val;
  },
  'bool': function(val, op, args) {
    if (typeof val == 'number')
      return !!val;

    if (typeof val == 'boolean')
      return val;

    var isTrue = ('' + val).match(/\W*(enabled|true|yes|yea|yeah|affirmative|y|checked|[1-9]+)/i);
    if (op == 'unformat') {
      return (isTrue !== null);
    } else if (op == 'format' || op === 'display' || op === 'sort') {
      return (isTrue) ? 'true' : 'false';
    }
  },
  'time': function(val, op, args) {
    if (op == 'unformat' || op === 'sort') {
      if (utils.noe(val))
        return null;

      if (utils.instanceOf(val, 'string'))
        val = val.split(',');
      else if (!utils.instanceOf(val, 'array'))
        val = [val];

      var finalVal = [];
      for (var i = 0, il = val.length; i < il; i++) {
        var v = val[i],
            format = (utils.instanceOf(v, 'number')) ? undefined : args.format,
            m = (args.asUTC) ? moment.utc(v, format) : moment(v, format);

        finalVal.push(m.valueOf());
      }

      if (finalVal.length === 1)
        return finalVal[0];
      return finalVal;
    } else if (op == 'format' || op === 'display') {
      if (utils.noe(val))
        return '';

      if (!utils.instanceOf(val, 'array'))
        val = [val];

      var finalVal = [];
      for (var i = 0, il = val.length; i < il; i++) {
        var v = val[i],
            format = (args.format) ? args.format : 'HH:mm:ss';
            m = (args.asUTC) ? moment.utc(v) : moment(v);

        finalVal.push(m.format(format));
      }

      return finalVal.join('/');
    }
  },
  'date': function(val, op, args) {
    if (op == 'validate')
      return;

    if (!args)
      args = {};

    var thisArgs = base.data.extend({format: 'MM/DD/YYYY'}, args);
    return formatters.time(val, op, thisArgs);
  },
  'number': function(val, op, args) {
    if (op == 'unformat' || op === 'sort') {
      if (typeof val == 'number')
        return val;

      if (!utils.instanceOf(val, 'string'))
        return val;

      val = parseFloat(('' + val).replace(/[^\d.-]/gi, ''));
      if (isNaN(val))
        val = 0;

      return val;
    } else if (op == 'format' || op === 'display') {
      if (!utils.instanceOf(val, 'number', 'string'))
        return val;

      if (utils.noe(val))
        return '';

      if (!args)
        args = {};

      var numRound = parseFloat(('' + val).replace(/[^\d.-]/gi, ''));
      if (isNaN(numRound))
        numRound = 0;

      //Range clamping
      var clampHigh, clampLow;
      if (args && args.formatClampRange) {
        var fcr = args.formatClampRange;
        if (fcr instanceof Array) {
          clampHigh = parmodule.exports = Object.assign(module.exports, {
            validators,
            validatorFunction: utils.formatterValidatorChainFactory.bind(root, validators),
            validatorExists: function(name) {
              var func = validators[name];
              return (func !== undefined);
            },
            addValidator: function(name, func) {
              validators[name] = func;
              return func;
            }
          });
          seFloat(fcr[1]);
          clampLow = parseFloat(fcr[0]);
        } else {
          clampHigh = parseFloat(fcr);
          clampLow = 0;
        }

        if (clampLow !== undefined && isNaN(clampLow))
          clampLow = undefined;

        if (clampHigh !== undefined && isNaN(clampHigh))
          clampHigh = undefined;

        if (clampLow !== undefined && clampHigh !== undefined && clampLow > clampHigh) {
          var tempClamp = clampLow;
          clampLow = clampHigh;
          clampHigh = tempClamp;
        }
      }

      if (clampLow !== undefined && numRound < clampLow)
        numRound = clampLow;

      if (clampHigh !== undefined && numRound > clampHigh)
        numRound = clampHigh;

      //Remember if the number is negative
      var humanExtraChar = '';
      if (args.humanReadable) {
        if (Math.abs(numRound) >= 1000000) {
          numRound /= 1000000;
          humanExtraChar = 'M';
        } else if (Math.abs(numRound) >= 1000) {
          numRound /= 1000;
          humanExtraChar = 'k';
        }
      }

      if (args.decimalPlaces && utils.instanceOf(args.decimalPlaces, 'string')) {
        args.decimalPlaces = parseInt(args.decimalPlaces, 10);
        if (isNaN(args.decimalPlaces))
          args.decimalPlaces = 0;
      }

      if (args.numericPlaces && utils.instanceOf(args.numericPlaces, 'string')) {
        args.numericPlaces = parseInt(args.numericPlaces, 10);
        if (isNaN(args.numericPlaces))
          args.numericPlaces = 0;
      }

      if (utils.instanceOf(args.numericPlaces, 'number') && args.numericPlaces > -1)
        numRound = numRound % Math.pow(10, args.numericPlaces);

      if (args.decimalPlaces === 0) {
        numRound = Math.round(numRound);
      } else {
        numRound = parseFloat(numRound.toFixed(args.decimalPlaces));
      }

      var numString = ((args.noLocale) ? numRound.toString() : numRound.toLocaleString());
      if (args.decimalPlaces && numString.indexOf('.') < 0)
        numString = ('' + numRound.toFixed(args.decimalPlaces));

      return numString.replace(/\.(\d+)$/,function(match, fraction) {
        var dl = args.decimalPlaces,
            fl = fraction.length;

        if (fl < dl) {
          var diff = dl - fl;
          return ('.' + fraction) + (new Array(diff + 1)).join('0');
        }

        return ('.' + fraction);
      }) + humanExtraChar;
    }
  },
  'integer': function(val, op, args) {
    if (op == 'validate')
      return;

    if (!args)
      args = {decimalPlaces: 0};
    else
      args.decimalPlaces = 0;

    return formatters.number(val, op, args);
  },
  'money': function(val, op, _args) {
    if (op == 'validate')
      return;

    var args = _args;
    if (!args)
      args = {decimalPlaces: 2};

    if (args.decimalPlaces === undefined || args.decimalPlaces === null)
      args.decimalPlaces = 2;

    //Format and return
    var numVal = formatters.number(val, op, args);
    if (utils.noe(numVal))
      return '';

    if (op === 'unformat' || op === 'sort')
      return numVal;
    else
      return '$' + numVal;
  },
  'percent': function(val, op, args) {
    if (op == 'validate')
      return;

    if (!args)
      args = {};

    if (args.decimalPlaces === undefined)
      args.decimalPlaces = 2;

    //Format and return
    if (args.humanReadable === true)
      args.humanReadable = false;

    var numVal = formatters.number(val, op, args);
    if (utils.noe(numVal))
      return '';

    if (op === 'unformat' || op === 'sort')
      return numVal;
    else
      return numVal + '%';
  },
  'phone': function(val, op, args) {
    if (op === 'format' || op === 'display') {
      if (!val)
        return '';

      val = ('' + val);
      if (val == null || val.length < 9 || val.length > 11)
        return val;

      var i = (val.length == 11 || val[0] == '1') ? 1 : 0;
      return '(' + val.substr(i, 3) + ') ' + val.substr(i + 3, 3) + '-' + val.substr(i + 6, 4);
    } else if (op === 'unformat' || op === 'sort') {
      if (val == null || val.length == 0)
        return val;

      val = ('' + val).replace(/[^0-9]/g, '');

      if (val.length == 10)
        return '1' + val;
      if (val.length == 11)
        return val;

      return '+' + val;
    }
  },
  'url': function(val, op, args) {
    if (op == 'validate')
      return;

    if (op == 'format' || op === 'display') {
      if (!val) return '';
      if (typeof val != 'string') return '';
      if (('' + val).replace(/\s/gi, '').length == 0) return '';
      if (('' + val).match(/^\w+:\/\//) == null) return 'http://' + val;
      return val;
    } else {
      return val;
    }
  }
};

module.exports = Object.assign(module.exports, {
  formatters,
  formatterFunction: utils.formatterValidatorChainFactory.bind(module.exports, formatters),
  formatterExists: function(name) {
    var func = formatters[name];
    return (func !== undefined);
  },
  addFormatter: function(name, func) {
    formatters[name] = func;
    return func;
  }
});
