// (c) 2016 Wyatt Greenway - devoir
// This code is licensed under MIT license (see LICENSE.txt for details)
// Use unrestricted with the permission of the author

'use strict';

/**
* Devoir Base Functionality
*
* @namespace devoir
**/

import htmlparser from 'htmlparser2';
const root = {};

function uid() {
	return 'U' + (uidCounter++);
};

function initMeta(node, namespace) {
  var metaContext;

  if (!node.hasOwnProperty('_meta')) {
  	var thisUID = uid();
  	metaContext = {'_UID': thisUID, '_aliases': {}};
  	Object.defineProperty(node, '_meta', {
	    configurable: false,
	    enumerable: false,
	    value: metaContext
  	});
  } else {
  	metaContext = node._meta;
  }

  if (arguments.length > 1 && namespace) {
  	if (!node._meta.hasOwnProperty(namespace)) {
	    metaContext = {};
	    Object.defineProperty(node._meta, namespace, {
	    	configurable: false,
	    	enumerable: false,
	    	value: metaContext
	    });	
  	} else {
    	metaContext = metaContext[namespace];
  	}
  }

  return metaContext;
}

function initAudit(node) {
  var timeCreated = getTimeNow();
  Object.defineProperty(node, '_audit', {
  	configurable: false,
  	enumerable: false,
  	value: {
	  	'base': {created: timeCreated, modified: timeCreated, updateCount: 0},
	  	'_meta': {created: timeCreated, modified: timeCreated, updateCount: 0}
  	}
  });
}

var uidCounter = 1;
root.uid = uid;

var getTimeNow = root.now = (function() {
	if (typeof performance !== 'undefined' && performance.now)
		return performance.now.bind(performance);

	var nanosecondsInMilliseconds = 1000000;
	return function() {
		var hrTime = process.hrtime();
		return (hrTime[0] * 1000) + (hrTime[1] / nanosecondsInMilliseconds);
	};
})();

//This function is deliberately large and confusing in order to squeeze
//every ounce of speed out of it
function prop(cmd, _node, namespace) {
	var node = _node;
	if (!node || !(node instanceof Object))
  	return;

	var GET = 0x01,
      SET = 0x02,
      REMOVE = 0x04,
      c,
	    isMetaNS = false,
	    isMeta = false,
	    argStartIndex,
	    argStartIndexOne,
	    context,
	    op = ((c = cmd.charAt(0)) === 'g') ? GET : (c === 's') ? SET : REMOVE,
	    finalPath = [];
		
	switch(cmd) {
    case 'getMetaNS':
    case 'setMetaNS':
    case 'removeMetaNS':
			isMetaNS = isMeta = true;
			argStartIndex = 3;
			argStartIndexOne = 4;

			if (!node.hasOwnProperty('_meta') || !node._meta.hasOwnProperty(namespace))
				context = initMeta(node, namespace);
			else
				context = node._meta[namespace];

			finalPath = ['_meta', namespace];

      break;
    case 'getMeta':
    case 'setMeta':
    case 'removeMeta':
			isMeta = true;
			argStartIndex = 2;
			argStartIndexOne = 3;

			if (!node.hasOwnProperty('_meta'))
				context = initMeta(node);
			else
				context = node._meta;

			finalPath = ['_meta'];

			break;
    default:
			argStartIndex = 2;
			argStartIndexOne = 3;
			context = node;
			break;
	}

	var prop,
			fullPath = '' + arguments[argStartIndex],
			nextIsArray,
			parts = [];

	//No path
	if (!fullPath) {
		if (op & SET)
			return '';

		if (op & REMOVE)
			return;

		return arguments[argStartIndexOne];
	}

  //Are there any parts to handle?
  if (fullPath.indexOf('.') > -1 || fullPath.indexOf('[') > -1) {
  	if (fullPath.indexOf('\\') > -1)
  		//If we have character escapes, take the long and slow route
  		parts = fullPath.replace(/([^\\])\[/g,'$1.[').replace(/([^\\])\./g,'$1..').replace(/\\([.\[])/g,'$1').split('..');
  	else
  		//Fast route
  		parts = fullPath.replace(/\[/g,'.[').split('.');

  	for (var i = 0, i2 = 1, il = parts.length; i < il; i++, i2++) {
  		var part = parts[i],
  				isLast = (i2 >= il),
  				isArrayIndex = (part.charAt(0) === '[');

  		//Is this an array index
  		if (isArrayIndex)
  			part = part.substring(1, part.length - 1);

  		//Get prop
  		prop = context[part];

  		if (op & REMOVE && isLast) {
  			//If this is the final part, and we are to remove the item...

  			if (arguments[argStartIndexOne] === true)
  				//ACTUALLY delete it if the user forces a delete
  				delete context[part];
  			else
  				//Otherwise do it the performant way by setting the value to undefined
  				context[part] = undefined;

  			//Return whatever the value was
  			return prop;
  		} else if (op & SET) {
  			//Are we setting the value?

  			//If this is the last part, or the value isn't set,
  			//or it is set but the path continues and it
  			//needs to be overwritten
  			if (isLast || (prop === undefined || prop === null || (!isLast && (!(prop instanceof Object) || prop instanceof Number || prop instanceof String || prop instanceof Boolean)))) {
  				//If the next part is an array, make sure to create an array
  				nextIsArray = (!isLast && parts[i2].charAt(0) === '[');

  				//What is our new value?
  				prop = (isLast) ? arguments[argStartIndexOne] : (nextIsArray) ? [] : {};

  				//Update context accordingly
  				if (context instanceof Array && !part) {
  					isArrayIndex = true;
  					part = '' + (context.push(prop) - 1);
  					context = prop;
  				} else if (part) {
  					context[part] = prop;
  					context = prop;
  				}
  			} else {
  				context = prop;
  			}

  			if (part)
  				finalPath.push((isArrayIndex) ? ('[' + part + ']') : part);
  		} else {
  			if (prop === undefined || prop === null || ((typeof prop === 'number' || prop instanceof Number) && (isNaN(prop) || !isFinite(prop))))	
  				return arguments[argStartIndexOne];
  			context = prop;
  		}
  	}
  } else {
  	if (op & REMOVE) {
  		prop = context[fullPath];

  		if (arguments[argStartIndexOne] === true)
				//ACTUALLY delete it if the user forces a delete
				delete context[part];
			else
				//Otherwise do it the performant way by setting the value to undefined
				context[part] = undefined;

			//Return whatever the value was
			return prop;
  	} else if (op & SET) {
  		context[fullPath] = arguments[argStartIndexOne];
  		return fullPath;
  	}

  	prop = context[fullPath];
  }

  if (op & GET) {
  	//Do we need to return the default value?
  	if (prop === undefined || prop === null || ((typeof prop === 'number' || prop instanceof Number) && (isNaN(prop) || !isFinite(prop))))	
  		return arguments[argStartIndexOne];
  	return prop;
  }

  if (!node.hasOwnProperty('_audit'))
    initAudit(node);

  var lastUpdated = getTimeNow();
  if (isMeta) {
  	var m = node._audit.meta;
    m.modified = lastUpdated;
    m.updateCount++;
  } else {
  	var b = node._audit.base;
    b.modified = lastUpdated;
    b.updateCount++;
  }

  return (op & SET) ? finalPath.join('.').replace(/\.\[/g, '[') : prop;
}

/**
* Get/set object id. By default every object will have a unique id. This id is stored in the objects meta properties
*
* @parent devoir
* @function id
* @param {Object} {obj} Object to get / set id from
* @param {String} {[set]} If specified set object id to this
* @return {String} Objects id
* @see devoir.getMeta
* @see devoir.setMeta
* @see devoir.get
* @see devoir.set
**/
function id(node, set) {
	if (arguments.length === 0)
		return;

	if (!node.hasOwnProperty('_meta'))
		initMeta(node);

	if (arguments.length === 1)
		return node._meta._UID;

	if (!node.hasOwnProperty('_audit'))
    initAudit(node);

	node._meta._UID = set;

	var m = node._audit.meta;
  m.modified = getTimeNow();
  m.updateCount++;

	return set;		
}

/**
* Get/set object aliases (from meta properties)
*
* @parent devoir
* @function aliases
* @param {Object} {obj} Object to get / set aliases from
* @param {Array|String} {[set]} If specified as an Array, set the entire aliases array to this. If specified as a string, add this alias to the list of aliases
* @return {Array} List of aliases
* @see devoir.getMeta
* @see devoir.setMeta
**/
function aliases(node, set) {
	if (arguments.length === 0)
		return;

	if (!node.hasOwnProperty('_meta'))
		initMeta(node);

	if (arguments.length === 1)
		return node._meta._aliases;

	if (!set)
		return;

	if (!node.hasOwnProperty('_audit'))
    initAudit(node);

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
* Get audit information on object
*
* @parent devoir
* @function audit
* @param {Object} {obj} Object to get audit information on
* @param {String} {[which]} 'meta' or 'base'. If 'meta', get audit information on meta property updates. If 'base', get audit information on base property updates. If neither is specified, get the most recently updated (meta or base, whichever is most recent)
* @return {Object} Meta information object, i.e {created: (timestamp), modified: (timestamp), updateCount: (count)}
**/
function audit(node, _which) {
	if (arguments.length === 0)
		return;

	var which = _which || '*';

	if (!node.hasOwnProperty('_audit'))
		initAudit(node);

	switch(which) {
		case '*':
			var m = node._audit.meta,
					b = node._audit.base;
			return (m.modified > b.modified) ? m : b;
		case 'meta':
			return node._audit.meta;
		case 'base':
			return node._audit.base;
	}
}

/**
* Delete ALL deletable properties from an object. This is useful when
* you want to "empty" an object while retaining all references to this object.
*
* @parent devoir
* @function empty
* @param {Object} {obj} Object to "clear"
* @return {Object} Same object but with all properties removed
* @note This could possibly have huge performance implications
**/
function empty(obj) {
	var keys = Object.keys(obj);
	for (var i = 0, len = keys.length; i < len; i++) {
		var k = keys[i];
		if (k === '_meta' || k === '_audit')
			continue;

		delete obj[k];
	}

	if (obj._meta || obj._audit) {
		if (!obj.hasOwnProperty('_audit'))
			initAudit(obj);

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
			if (obj instanceof Promise)
				return true;

			if (obj instanceof Object && obj.then instanceof Function)
				return true;
			
			return false;
		}	

		if (obj === undefined || obj === null)
			return false;

		var val = _val,
				typeOf = (typeof obj);

		if (val === String)
			val = 'string';
		else if (val === Number)
			val = 'number';
		else if (val === Boolean)
			val = 'boolean';
		else if (val === Function)
			val = 'function';
		else if (val === Array)
			val = 'array';
		else if (val === Object)
			val = 'object';

		if (val === 'deferred' && isDeferredType(obj))
			return true;

		if (val === 'number' && (typeof obj === 'number' || (obj instanceof Number)) && (isNaN(obj) || !isFinite(obj)))
			return false;

		if (val === typeOf)
			return true;

		if (val === 'number' && obj instanceof Number)
			return true;

		if (val === 'string' && obj instanceof String)
			return true;

		if (val === 'boolean' && obj instanceof Boolean)
			return true;

		if (val === 'function' && obj instanceof Function)
			return true;

		if (val === 'array' && obj instanceof Array)
			return true;

		if (val instanceof Function && obj instanceof val)
			return true;

		return false;
	}

	for (var i = 1, len = arguments.length; i < len; i++) {
		if (testType(obj, arguments[i]) === true)
			return true;
	}

	return false;
};

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
	if (obj === undefined || obj === null)
		return 0;

	if (obj.size instanceof Function)
		return obj.size();
	
	if ((obj instanceof Array) || (typeof obj === 'string') || (obj instanceof String))
		return obj.length;

	if (obj.length !== undefined && obj.length !== null)
		return obj.length;

	if (obj instanceof Object)
		return Object.keys(obj).length;

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
		if (val === undefined || val === null)
			return true;

		if ((typeof val === 'string' || val instanceof String) && !val.match(/\S/))
			return true;

		if ((typeof val === 'number' || val instanceof Number) && (isNaN(val) || !isFinite(val)))
			return true;

		if (typeof val === 'object') {
			if (sizeOf(val) == 0)
				return true;
		}
	}

	return false;
};

/**
* @function {prettify} Capitalize the first letter of the first word, or optionally capitalize
* the first letter of every word if *allWords* argument is **true**
* @param {String} {str} String to modify
* @param {Boolean} {[allWords=false]} If **true**, capitalize the first letter of EVERY word (instead of just the first)
* @return {String} A prettified string
*/
function prettify(tempStr, allWords) {
	if (root.noe(tempStr))
		return '';

	if (allWords) {
		return ('' + tempStr).toLowerCase().replace(/\b(\w)/gi, function(a, x) { return '' + x.toUpperCase(); });
	} else {
		return ('' + tempStr).replace(/^([^\w]*)(\w)(\w+)?/gi, function(a, x, y, z) { var initial = x + y.toUpperCase(); return (z) ? (initial + z.toLowerCase()) : (initial); });
	}
}

function parseHTML(htmlStr) {
	function calculateInnerHTML(children, filter) {
		var parts = [];
		for (var i = 0, il = children.length; i < il; i++) {
			var node = children[i];

			if (filter && node.type !== filter)
				continue;

			if (node.type === 1) {
				//Element node

				let nodeName = node.name.toLowerCase();
				parts.push('<');
				parts.push(nodeName);

				//Attributes
				var attributes = node.attributes;
				if (attributes) {
					var keys = Object.keys(attributes);
					for (var j = 0, jl = keys.length; j < jl; j++) {
						var name = keys[j],
								value = attributes[name];

						parts.push(' ');
						parts.push(name);
						parts.push('="');
						parts.push(value);
						parts.push('"');
					}
				}

				parts.push('>');

				//If self-closing simply continue
				if (nodeName.match(/^(area|base|br|col|command|embed|hr|img|input|keygen|link|meta|param|source|track|wbr)$/))
					continue;

				//Children
				if (node.children && node.children.length)
					parts.push(calculateInnerHTML(node.children));

				//End tag
				parts.push('</');
				parts.push(nodeName);
				parts.push('>');
			} else if (node.type === 3) {
				//Text node
				parts.push(node.innerHTML);
			}
		}

		return parts.join('');
	}

	function createNewNode(type, parent, name) {
		var node = {type: type, parent: parent, id: uid++};
		
		if (type === 3) {
			Object.defineProperty(node, '_value', {
	  		writable: true,
	  		configurable: false,
	  		enumerable: false,
	  		value: ''
	  	});
		} else {
			node.children = [];
		}

		if (name)
			node.name = name;

		Object.defineProperty(node, 'innerHTML', {
  		writable: false,
  		configurable: false,
  		enumerable: true,
  		get: function() {
				if (type === 3)
					return node._value;
				return calculateInnerHTML(node.children)
			},
  		set: function(value) {
  			if (type === 3) {
  				node._value = value;
  				return;
  			}

				node.children = parseHTML(value).children
			}
  	});

  	Object.defineProperty(node, 'innerText', {
  		writable: false,
  		configurable: false,
  		enumerable: true,
  		get: function() {
				if (type === 3)
					return node._value;
				return calculateInnerHTML(node.children, 3)
  		},
  		set: function(value) {
  			if (type === 3) {
  				node._value = value;
  				return;
  			}

				var n = createNewNode(3, node);
				n._value = value;
				node.children = [n];
  		}
  	});
	}

	var uid = 1,
			currentNode = createNewNode(9, null, 'body'),
			docNode = currentNode;

	var parser = new htmlparser.Parser({
    onopentag: function(name, attributes) {
    	var node = currentNode = createNewNode(1, currentNode, name);
      node.attributes = attributes || {};
      node.parent.children.push(node);
    },
    ontext: function(text) {
    	var node = createNewNode(3, currentNode);
    	currentNode.children.push(node);
    },
    onclosetag: function(tagname) {
      currentNode = currentNode.parent;
    }
	}, {
		decodeEntities: true,
		recognizeSelfClosing: true
	});

	parser.write(htmlStr);
	parser.end();

	return docNode;
}

function convertHTML(html, cb) {
	function walk(node) {
		if (!node)
			return;

		var c, builtChildren = [];

		if (node.children) {
			for (var children = node.children, i = 0, il = children.length; i < il; i++) {
				var child = children[i];
				c = walk(child);
				if (c)
					builtChildren.push(c);
			}
		}

		return cb(node, builtChildren, node.parent);
	}

	var docNode = (html instanceof Object && !(html instanceof String)) ? html : parseHTML(html);
	return walk(docNode);
}

function parseCSS(cssStr) {
	var css = {};
	cssStr.replace(/([\w-]+?)\s*:\s*([^;]+)/g, function(m, name, value) {
		css[name.replace(/-(\w)/g, function(m, p) {
			return p.toUpperCase();
		})] = value.replace(/^(['"])(.*)\1$/g, "$2");
	});

	return css;
}

/**
* Get a property from an object and all sub-objects by evaluating a dot-notation path into an object.
*
* @parent devoir
* @function get
* @param {Object} {obj} Object to get property from
* @param {String} {path} Dot notation path to evaluate
* @param {*} {[defaultValue=undefined]} Specify a default value to return if the requested property is not found, is null, undefined, NaN or !isFinite
* @return {*} Return property specified by path
* @see devoir.set
* @example {javascript}
	var obj = {hello: {world: "!!!"}, arr:[[1,2],3,4,5]};
	devoir.get(obj, 'hello.world'); //!!!
	devoir.get(obj, "some.key.that.doesn't.exist", 'not found'); //not found
	devoir.get(obj, "arr[0][0]"); //1
	devoir.get(obj, "arr[1]"); //3
**/
root.get = prop.bind(root, 'get');

/**
* Set a property on an object by evaluating a dot-notation path into an object.
*
* @parent devoir
* @function set
* @param {Object} {obj} Object to set property on
* @param {String} {path} Dot notation path to evaluate
* @param {*} {value} Value to set
* @return {String} Return the actual final path (relative to the base object) where the property was set. This is useful if property was pushed into an array; the actual array index will be returned as part of the final path
* @see devoir.get
* @note With empty array notation in a specified path (i.e my.array.key[]) the value will be appended to the array specified
* @example {javascript}
	var obj = {};
	devoir.set(obj, 'hello.world', '!!!'); //hello.world
	devoir.set(set, "arr[]", [1]); //arr[0]
	devoir.set(obj, "arr[0][1]", 2); //arr[0][1]
	devoir.set(obj, "arr[]", 3); //arr[1]
**/
root.set = prop.bind(root, 'set');

/**
* Remove a property from an object/sub-object by evaluating a dot-notation path into an object.
*
* @parent devoir
* @function remove
* @param {Object} {obj} Object to remove property from
* @param {String} {path} Dot notation path to evaluate
* @return {*} Return property value of removed key specified by path
* @see devoir.set devoir.get
* @example {javascript}
	var obj = {hello: {world: "!!!"}, arr:[[1,2],3,4,5]};
	devoir.remove(obj, 'hello.world'); //obj === {hello: {}, arr:[[1,2],3,4,5]}
**/
root.remove = prop.bind(root, 'remove');

/**
* Get a meta property from an object and all sub-objects by evaluating a dot-notation path into an object. This is the same as @@devoir.get except it is used for object meta properties
*
* @parent devoir
* @function getMeta
* @param {Object} {obj} Object to get meta property from
* @param {String} {path} Dot notation path to evaluate
* @param {*} {[defaultValue=undefined]} Specify a default value to return if the requested meta property is not found, is null, undefined, NaN or !isFinite
* @return {*} Return property specified by path
* @see devoir.setMeta
**/
root.getMeta = prop.bind(root, 'getMeta');

/**
* Set a meta property on an object by evaluating a dot-notation path into an object. This is the same as @@devoir.set except it is used for object meta properties
*
* @parent devoir
* @function setMeta
* @param {Object} {obj} Object to set meta property on
* @param {String} {path} Dot notation path to evaluate
* @param {*} {value} Value to set
* @return {String} Return the actual final path (relative to the base object) where the meta property was set. This is useful if meta property was pushed into an array; the actual array index will be returned as part of the final path
* @see devoir.getMeta
**/
root.setMeta = prop.bind(root, 'setMeta');

/**
* Remove a meta property from an object/sub-objects by evaluating a dot-notation path into an object. This is the same as @@devoir.remove except it is used for object meta properties
*
* @parent devoir
* @function removeMeta
* @param {Object} {obj} Object to remove meta property from
* @param {String} {path} Dot notation path to evaluate
* @return {*} Return property value of removed key specified by path
* @see devoir.setMeta
**/
root.removeMeta = prop.bind(root, 'removeMeta');

/**
* Get a namespaced meta property from an object and all sub-objects by evaluating a dot-notation path into an object. This is the same as @@devoir.getMeta except that the value is retrieved from a namespace
*
* @parent devoir
* @function getMetaNS
* @param {Object} {obj} Object to get meta property from
* @param {String} {namespace} Namespace to store meta property in
* @param {String} {path} Dot notation path to evaluate
* @param {*} {[defaultValue=undefined]} Specify a default value to return if the requested meta property is not found, is null, undefined, NaN or !isFinite
* @return {*} Return property specified by path
* @see devoir.getMeta
* @see devoir.setMeta
**/
root.getMetaNS = prop.bind(root, 'getMetaNS');

/**
* Set a namespaced meta property on an object by evaluating a dot-notation path into an object. This is the same as @@devoir.setMeta except that the value is stored in a namespace
*
* @parent devoir
* @function setMetaNS
* @param {Object} {obj} Object to set meta property on
* @param {String} {namespace} Namespace to store meta property in
* @param {String} {path} Dot notation path to evaluate
* @param {*} {value} Value to set
* @return {String} Return the actual final path (relative to the base object) where the meta property was set. This is useful if meta property was pushed into an array; the actual array index will be returned as part of the final path
* @see devoir.getMeta
**/
root.setMetaNS = prop.bind(root, 'setMetaNS');

/**
* Remove a namespaced meta property from an object/sub-objects by evaluating a dot-notation path into an object. This is the same as @@devoir.removeMeta except that the value is retrieved from a namespace
*
* @parent devoir
* @function removeMetaNS
* @param {Object} {obj} Object to remove meta property from
* @param {String} {namespace} Namespace to remove meta property in
* @param {String} {path} Dot notation path to evaluate
* @return {*} Return property value of removed key specified by path
* @see devoir.removeMeta
**/
root.removeMetaNS = prop.bind(root, 'removeMetaNS');

root.parseHTML = parseHTML;
root.convertHTML = convertHTML;
root.parseCSS = parseCSS;

root.id = id;
root.aliases = aliases;
root.audit = audit;
root.empty = empty;
root.instanceOf = instanceOf;
root.sizeOf = sizeOf;
root.noe = noe;
root.prettify = prettify;

module.exports = root;