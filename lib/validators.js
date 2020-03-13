// (c) 2017 Wyatt Greenway
// This code is licensed under MIT license (see LICENSE.txt for details)
// Use unrestricted with the permission of the author

'use strict';
import utils from './utils';

/**
  * eVisit Utility Functionality
  * @namespace {evisit-core-js}
  * @namespace {validators}
  */

const validators = {
  'greater': function greater(val, op, args) {
    if (!utils.instanceOf(val, 'number'))
      return;

    if (!utils.instanceOf(args.value, 'number'))
      return;

    if (args.value >= val)
      return {type: 'error', message: 'Must be larger than ' + args.value};
  },
  'smaller': function smaller(val, op, args) {
    if (!utils.instanceOf(val, 'number'))
      return;

    if (!utils.instanceOf(args.value, 'number'))
      return;

    if (args.value <= val)
      return {type: 'error', message: 'Must be smaller than ' + args.value};
  },
  'password': function password(val, op, args) {
    if (utils.noe(val))
      return;

    if (val.length < 8)
      return {type: 'error', message: "Password must be at least 8 characters long"};
  },
  'positive': function positive(val, op, args) {
    var message = args.message || 'Value must be positive';
    if (utils.noe(val))
      return;

    if (!utils.instanceOf(val, 'number'))
      return;

    if (val < 0)
      return {type: 'error', message: message};
  },
  'required': function required(val, op, args) {
    var message = args.message || 'Value required';
    if (val instanceof Array && val.length > 0 && args.connectWith)
      val = val[0];

    if (utils.noe(val))
      return {type: 'error', message: message};
  },
  'number': function number(val, op, args) {
    if (utils.noe(val))
      return;

    var message = args.message || 'Invalid number',
        num = parseFloat(val);

    if (isNaN(num))
      return {type: 'error', message: message};
  },
  'numeric': function numeric(val, op, args) {
    if (utils.noe(val))
      return;

    var message = args.message || 'Can only be digits',
        re = /^\d+$/;

    if (!re.test(val))
      return {type: 'error', message: message};
  },
  'alphanum': function alphanum(val, op, args) {
    if (utils.noe(val))
      return;

    var message = args.message || 'Must be alpha-numeric',
        re = /^[0-9a-zA-Z]+$/;

    if (!re.test(val))
      return {type: 'error', message: message};
  },
  'email': function email(val, op, args) {
    if (utils.noe(val))
      return;

    var message = args.message || 'Invalid email address',
        re = /^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))){2,6}$/i;

    if (!re.test(val))
      return {type: 'error', message: message};
  },
  'url': function url(val, op, args) {
    if (utils.noe(val))
      return;

    var message = args.message || 'Invalid URL',
        re = /^(https?|s?ftp|git):\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i;

    if (!re.test(val))
      return {type: 'error', message: message};
  },
  'date': function date(val, op, args) {
    if (utils.noe(val))
      return;

    var message = args.message || 'Invalid date',
        re = /^(0[1-9]|1[0-2])\D?([12]\d|0[1-9]|3[01])\D?(\d{4})$/;

    if (!re.test(val))
      return {type: 'error', message: message};
  },
  'phone': function phone(val, op, args) {
    if (utils.noe(val))
      return;

    var message = args.message || 'Invalid phone number';

    if (('' + val).replace(/\D/g, '').length < 10)
      return {type: 'error', message: message};
  }
};

module.exports = Object.assign(module.exports, {
  validators,
  validatorFunction: utils.formatterValidatorChainFactory.bind(module.exports, validators),
  validatorExists: function(name) {
    var func = validators[name];
    return (func !== undefined);
  },
  addValidator: function(name, func) {
    validators[name] = func;
    return func;
  }
});
