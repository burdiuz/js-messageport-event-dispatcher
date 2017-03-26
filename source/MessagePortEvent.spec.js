/**
 * Created by Oleg Galaburda on 15.02.16.
 */

import { MessagePortEvent } from './MessagePortDispatcher';

describe('MessagePortEvent', () => {
  describe('Instance', () => {
    let event = null;
    let mpEvent = null;
    beforeEach(() => {
      event = { type: 'any-event', data: null };
      mpEvent = new MessagePortEvent(event, 'qwerty123456');
    });
    it('should store event link', () => {
      expect(mpEvent.event).to.be.equal(event);
    });
    it('should store dispatcher Id', () => {
      expect(mpEvent.dispatcherId).to.be.equal('qwerty123456');
    });
    describe('toJSON()', () => {
      it('should return raw object representation', () => {
        const obj = mpEvent.toJSON();
        expect(JSON.parse(obj.event)).to.be.eql(event);
        expect(obj.dispatcherId).to.be.equal('qwerty123456');
      });
    });
    describe('When event has toJSON', () => {
      let toJSON = null;
      let obj = null;
      beforeEach(() => {
        toJSON = sinon.spy(() => ({ result: true }));
        event.toJSON = toJSON;
        obj = mpEvent.toJSON();
      });
      it('should call toJSON() on event', () => {
        expect(toJSON).to.be.calledOnce;
      });
      it('should store result', () => {
        expect(obj.event).to.be.eql({ result: true });
      });
    });
  });
  describe('parse()', () => {
    it('should accept JSON string as parameter', () => {
      const jsonString = JSON.stringify({
        event: { type: 'my-event' },
        dispatcherId: 'asdfgh',
      });
      expect(MessagePortEvent.parse(jsonString)).to.be.eql({
        event: { type: 'my-event' },
        dispatcherId: 'asdfgh',
      });
    });
    it('should accept event being JSON string', () => {
      const jsonString = {
        event: JSON.stringify({ type: 'my-event' }),
        dispatcherId: 'password',
      };
      expect(MessagePortEvent.parse(jsonString)).to.be.eql({
        event: { type: 'my-event' },
        dispatcherId: 'password',
      });
    });
    it('should accept object as parameter', () => {
      expect(MessagePortEvent.parse({
        event: { type: 'my-event' },
        dispatcherId: '111111',
      })).to.be.eql({
        event: { type: 'my-event' },
        dispatcherId: '111111',
      });
    });
    it('should return null if no \'event\' field', () => {
      expect(MessagePortEvent.parse({ dispatcherId: '123456789' })).to.be.null;
    });
  });
  describe('isEvent()', () => {
    it('should return false if no event field', () => {
      expect(MessagePortEvent.isEvent({ dispatcherId: '123456' })).to.be.false;
    });
    it('should return false if no dispatcherId field', () => {
      expect(MessagePortEvent.isEvent({ event: {} })).to.be.false;
    });
    it('should return true if event and dispatcherId fields present', () => {
      expect(MessagePortEvent.isEvent({ event: {}, dispatcherId: 'letmein' })).to.be.true;
    });

  });
});
