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

const validators = {},
      root = {
        validators: validators
      };

root.validatorFunction = utils.formatterValidatorChainFactory.bind(root, validators);

root.validatorExists = function(name) {
  var func = validators[name];
  return (func !== undefined);
};

root.addValidator = function(name, func) {
  validators[name] = func;
  return func;
};

validators.greater = function greater(val, op, args) {
  if (!utils.instanceOf(val, 'number'))
    return;

  if (!utils.instanceOf(args.value, 'number'))
    return;

  if (args.value >= val)
    return ['error', 'Must be larger than ' + args.value];
};

validators.smaller = function smaller(val, op, args) {
  if (!utils.instanceOf(val, 'number'))
    return;

  if (!utils.instanceOf(args.value, 'number'))
    return;

  if (args.value <= val)
    return ['error', 'Must be smaller than ' + args.value];
};

validators.password = function password(val, op, args) {
  if (utils.noe(val))
    return;

  if (val.length < 8)
    return ['error', "Password must be at least 8 characters long"];
};

validators.positive = function positive(val, op, args) {
  if (utils.noe(val))
    return;

  if (!utils.instanceOf(val, 'number'))
    return;

  if (val < 0)
    return ['error', 'Value must be positive'];
};

validators.required = function required(val, op, args) {
  if (val instanceof Array && val.length > 0 && args.connectWith)
    val = val[0];

  if (utils.noe(val))
    return ['error', 'Value required'];
};

validators.number = function number(val, op, args) {
  if (utils.noe(val))
    return;

  var re = /^-?(?:\d+|\d{1,3}(?:,\d{3})+)?(?:\.\d+)?$/;
  if (!re.test(val))
    return ['error', 'Invalid number'];
};

validators.numeric = function numeric(val, op, args) {
  if (utils.noe(val))
    return;

  var re = /^\d+$/;
  if (!re.test(val))
    return ['error', 'Can only be digits'];
};

validators.alphanum = function alphanum(val, op, args) {
  if (utils.noe(val))
    return;

  var re = /^\w+$/;
  if (!re.test(val))
    return ['error', 'Must be alpha-numeric'];
};

validators.email = function email(val, op, args) {
  if (utils.noe(val))
    return;

  var re = /^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))){2,6}$/i;
  if (!re.test(val))
    return ['error', 'Invalid email address'];
};

validators.url = function url(val, op, args) {
  if (utils.noe(val))
    return;

  var re = /^(https?|s?ftp|git):\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i;
  if (!re.test(val))
    return ['error', 'Invalid URL'];
};

validators.date = function date(val, op, args) {
  if (utils.noe(val))
    return;

  var re = /^(\d{4})\D?(0[1-9]|1[0-2])\D?([12]\d|0[1-9]|3[01])$/;
  if (!re.test(val))
    return ['error', 'Invalid date'];
};

validators.phone = function phone(val, op, args) {
  if (utils.noe(val))
    return;

  var re = /^((\+\d{1,3}(-| )?\(?\d\)?(-| )?\d{1,5})|(\(?\d{2,6}\)?))(-| )?(\d{3,4})(-| )?(\d{4})(( x| ext)\d{1,5}){0,1}$/;
  if (!re.test(val))
    return ['error', 'Invalid phone number'];
};

module.exports = Object.assign(module.exports, root);
