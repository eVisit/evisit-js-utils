import htmlparser from 'htmlparser2';

const root = {};

function parseHTML(htmlStr) {
	function calculateInnerHTML(children) {
		var parts = [];
		for (var i = 0, il = children.length; i < il; i++) {
			var node = children[i];

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

	var currentNode = {name: 'body', type: 9, parent: null, children: []},
			docNode = currentNode;

	var parser = new htmlparser.Parser({
    onopentag: function(name, attributes) {
    	var node = currentNode = {type: 1, parent: currentNode};
      node.name = name;
      node.attributes = attributes || {};
      node.children = [];
      node.parent.children.push(node);
    },
    ontext: function(text) {
    	var node = {type: 3, parent: currentNode};
    	node.innerHTML = text;
    	currentNode.children.push(node);
    },
    onclosetag: function(tagname) {
    	currentNode.innerHTML = calculateInnerHTML(currentNode.children);
      currentNode = currentNode.parent;
    }
	}, {
		decodeEntities: true,
		recognizeSelfClosing: true
	});

	parser.write(htmlStr);
	parser.end();

	docNode.innerHTML = calculateInnerHTML(docNode.children);

	return docNode;
}

function convertHTML(htmlStr, cb) {
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

	var docNode = parseHTML(htmlStr);
	return walk(docNode);
}

root.parseHTML = parseHTML;
root.convertHTML = convertHTML;

module.exports = root;