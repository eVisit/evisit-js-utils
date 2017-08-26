describe('prop', function() {
  var formatters = require('../../lib/formatters');

  beforeEach(function() {
  });

  it('should be able to create and use a formatter', function() {
    var formatFunc = formatters.formatterFunction('money');
    expect(formatFunc(45.345645, 'format')).toBe('$45.35');
  });

  it('should be able to create and use a formatter with arguments', function() {
    var formatFunc = formatters.formatterFunction('number');
    expect(formatFunc(45.345645, 'format', { decimalPlaces: 3 })).toBe('45.346');
    expect(formatFunc(65445.345641, 'format', { decimalPlaces: 4, numericPlaces: 3 })).toBe('445.3460');
    expect(formatFunc(4345876785.345645, 'format', { humanReadable: true })).toBe('4,346M');
  });
});
