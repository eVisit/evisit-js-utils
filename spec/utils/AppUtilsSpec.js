describe('simpleHTMLToJSX', function() {
	var utils = require('../../lib/appUtils');

	beforeEach(function() {
  });

	it('should be able to convert simple html', function() {
		var str = utils.simpleHTMLToJSX('Hello <a href="#stuff">World</a>!');
		console.log(str);
  });
});