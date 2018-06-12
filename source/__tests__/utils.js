import { toRawData, parseRawData } from '../utils';

describe('toRawData()', () => {
  describe('When toJSON is defined', () => {
    let object;
    let result;

    beforeEach(() => {
      object = {
        toJSON: jest.fn(() => ({})),
      };
      result = toRawData(object);
    });

    it('should use object toJSON() method', () => {
      expect(object.toJSON).toHaveBeenCalledTimes(1);
    });

    it('should return object', () => {
      expect(typeof result).toBe('object');
    });
  });

  describe("When toJSON isn't defined", () => {
    let object;
    let result;

    beforeEach(() => {
      object = { value: true, target: {}, type: 'anystring' };
      result = toRawData(object);
    });

    it('should return string', () => {
      expect(typeof result).toBe('string');
    });

    it('should return proper JSON', () => {
      expect(JSON.parse(result)).toEqual(object);
    });
  });
});

describe('parse()', () => {
  it('should accept object as parameter', () => {
    expect(parseRawData({ something: '123' })).toEqual({ something: '123' });
  });

  it('should accept string as parameter', () => {
    expect(parseRawData(JSON.stringify({ something: '123' }))).toEqual({
      something: '123',
    });
  });
});
