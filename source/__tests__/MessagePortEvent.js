/**
 * Created by Oleg Galaburda on 15.02.16.
 */
import {
  MessagePortEvent,
  isMessagePortEvent,
  parseMessagePortEvent,
} from '../MessagePortEvent';

describe('MessagePortEvent', () => {
  describe('Instance', () => {
    let event = null;
    let mpEvent = null;

    beforeEach(() => {
      event = { type: 'any-event', data: null };
      mpEvent = new MessagePortEvent(event, 'qwerty123456');
    });

    it('should store event link', () => {
      expect(mpEvent.event).toBe(event);
    });

    it('should store dispatcher Id', () => {
      expect(mpEvent.dispatcherId).toBe('qwerty123456');
    });

    describe('toJSON()', () => {
      it('should return raw object representation', () => {
        const obj = mpEvent.toJSON();
        expect(JSON.parse(obj.event)).toEqual(event);
        expect(obj.dispatcherId).toBe('qwerty123456');
      });
    });

    describe('When event has toJSON', () => {
      let toJSON = null;
      let obj = null;

      beforeEach(() => {
        toJSON = jest.fn(() => ({ result: true }));
        event.toJSON = toJSON;
        obj = mpEvent.toJSON();
      });

      it('should call toJSON() on event', () => {
        expect(toJSON).toHaveBeenCalledTimes(1);
      });

      it('should store result', () => {
        expect(obj.event).toEqual({ result: true });
      });
    });
  });

  describe('parseMessagePortEvent()', () => {
    it('should accept JSON string as parameter', () => {
      const jsonString = JSON.stringify({
        event: { type: 'my-event' },
        dispatcherId: 'asdfgh',
      });

      expect(parseMessagePortEvent(jsonString)).toEqual({
        event: { type: 'my-event' },
        dispatcherId: 'asdfgh',
      });
    });

    it('should accept event being JSON string', () => {
      const jsonString = {
        event: JSON.stringify({ type: 'my-event' }),
        dispatcherId: 'password',
      };

      expect(parseMessagePortEvent(jsonString)).toEqual({
        event: { type: 'my-event' },
        dispatcherId: 'password',
      });
    });

    it('should accept object as parameter', () => {
      expect(
        parseMessagePortEvent({
          event: { type: 'my-event' },
          dispatcherId: '111111',
        }),
      ).toEqual({
        event: { type: 'my-event' },
        dispatcherId: '111111',
      });
    });

    it("should return null if no 'event' field", () => {
      expect(parseMessagePortEvent({ dispatcherId: '123456789' })).toBeNull();
    });
  });
});

describe('isMessagePortEvent()', () => {
  it('should return false if no event field', () => {
    expect(isMessagePortEvent({ dispatcherId: '123456' })).toBe(false);
  });

  it('should return false if no dispatcherId field', () => {
    expect(isMessagePortEvent({ event: {} })).toBe(false);
  });

  it('should return true if event and dispatcherId fields present', () => {
    expect(isMessagePortEvent({ event: {}, dispatcherId: 'letmein' })).toBe(
      true,
    );
  });
});
