/**
 * Created by Oleg Galaburda on 15.02.16.
 */
/* eslint-disable no-restricted-globals */
import EventDispatcher from '@actualwave/event-dispatcher';
import { MessagePortDispatcher } from '../index';

describe('MessagePortDispatcher', () => {
  let messagePort;
  let dispatcher;

  beforeEach(() => {
    messagePort = new EventDispatcher();
    jest.spyOn(messagePort, 'addEventListener');
    jest.spyOn(messagePort, 'hasEventListener');
    jest.spyOn(messagePort, 'removeEventListener');
    jest.spyOn(messagePort, 'dispatchEvent');
    messagePort.postMessage = jest.fn();

    dispatcher = new MessagePortDispatcher(messagePort);
  });

  describe('When using custom postMessage handler', () => {
    let customHandler;

    beforeEach(() => {
      customHandler = jest.fn();
      dispatcher = new MessagePortDispatcher(messagePort, customHandler);
      dispatcher.dispatchEvent('any-event');
    });

    it('should call custom handler', () => {
      expect(customHandler).toHaveBeenCalledTimes(1);
    });

    it('should not call own handler', () => {
      expect(messagePort.postMessage).not.toHaveBeenCalled();
    });
  });

  it('self() should create MessagePortDispatcher for current window', () => {
    expect(MessagePortDispatcher.self().target).toBe(self);
  });

  it('parent() should create MessagePortDispatcher for parent window', () => {
    expect(MessagePortDispatcher.parent().target).toBe(parent);
  });

  it('top() should create MessagePortDispatcher for top window', () => {
    expect(MessagePortDispatcher.top().target).toBe(top);
  });

  describe('When using pre-processors', () => {
    let sendPreprocessor;
    let recieverPreprocessor;

    beforeEach(() => {
      sendPreprocessor = jest.fn((event) => event);
      recieverPreprocessor = jest.fn((event) => event);
      dispatcher = new MessagePortDispatcher(
        messagePort,
        null,
        recieverPreprocessor,
        sendPreprocessor,
      );
    });

    describe('When sending event', () => {
      beforeEach(() => {
        dispatcher.dispatchEvent('sentEvent');
      });

      it('should call preprocessor for sent event', () => {
        expect(sendPreprocessor).toHaveBeenCalledTimes(1);
        expect(sendPreprocessor).toHaveBeenCalledWith(expect.objectContaining({ type: 'sentEvent' }));
      });
    });

    describe('When receiving event', () => {
      beforeEach(() => {
        messagePort.dispatchEvent('message', {
          event: {
            type: 'receivedEvent',
            data: null,
          },
          dispatcherId: 'not-this-dispatcher',
        });
      });

      it('should call preprocessor for received event', () => {
        expect(recieverPreprocessor).toHaveBeenCalledTimes(1);
        expect(recieverPreprocessor).toHaveBeenCalledWith(expect.objectContaining({ type: 'receivedEvent' }));
      });
    });
  });

  describe('toJSON()', () => {
    describe('When toJSON is defined', () => {
      let object;
      let result;

      beforeEach(() => {
        object = {
          toJSON: jest.fn(() => ({})),
        };
        result = MessagePortDispatcher.toJSON(object);
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
        result = MessagePortDispatcher.toJSON(object);
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
      expect(MessagePortDispatcher.parse({ something: '123' })).toEqual({ something: '123' });
    });

    it('should accept string as parameter', () => {
      expect(MessagePortDispatcher.parse(JSON.stringify({ something: '123' }))).toEqual({
        something: '123',
      });
    });
  });

  describe('create()', () => {
    let customHandler;
    let sendPreprocessor;
    let recieverPreprocessor;

    beforeEach(() => {
      customHandler = jest.fn();
      sendPreprocessor = jest.fn((event) => event);
      recieverPreprocessor = jest.fn((event) => event);
      dispatcher = MessagePortDispatcher.create(
        messagePort,
        customHandler,
        recieverPreprocessor,
        sendPreprocessor,
      );

      dispatcher.dispatchEvent('sentEvent');
      messagePort.dispatchEvent('message', {
        event: {
          type: 'receivedEvent',
          data: null,
        },
        dispatcherId: 'not-this-dispatcher',
      });
    });

    it('should create dispatcher', () => {
      expect(dispatcher).toBeInstanceOf(MessagePortDispatcher);
    });

    it('should save custom handler', () => {
      expect(customHandler).toHaveBeenCalledTimes(1);
      expect(customHandler.mock.calls[0][0]).toEqual(expect.objectContaining({
        event: expect.objectContaining({ type: 'sentEvent' }),
      }));
    });

    it('should call preprocessor for sent event', () => {
      expect(sendPreprocessor).toHaveBeenCalledTimes(1);
      expect(sendPreprocessor.mock.calls[0][0]).toEqual(expect.objectContaining({ type: 'sentEvent' }));
    });

    it('should call preprocessor for received event', () => {
      expect(recieverPreprocessor).toHaveBeenCalledTimes(1);
      expect(recieverPreprocessor.mock.calls[0][0]).toEqual(expect.objectContaining({ type: 'receivedEvent' }));
    });
  });

  describe('Instance', () => {
    it('should have property with sender EventDispatcher', () => {
      expect(dispatcher.sender).toBeInstanceOf(EventDispatcher);
    });

    it('should have property with receiver EventDispatcher', () => {
      expect(dispatcher.receiver).toBeInstanceOf(EventDispatcher);
    });

    it('sender and receiver should not be same', () => {
      expect(dispatcher.sender).not.toBe(dispatcher.receiver);
    });

    it('should have property with MessagePort', () => {
      expect(dispatcher.target).toBe(messagePort);
    });

    it('should have unique Id', () => {
      expect(typeof dispatcher.dispatcherId).toBe('string');
    });

    describe('Send events', () => {
      let event;
      let listener;
      let senderListener;
      let receiverListener;

      beforeEach(() => {
        listener = jest.fn();
        senderListener = jest.fn();
        receiverListener = jest.fn();
        event = { type: 'myEvent', data: 'anything' };
        dispatcher.addEventListener('myEvent', listener);
        dispatcher.sender.addEventListener('myEvent', senderListener);
        dispatcher.receiver.addEventListener('myEvent', receiverListener);
        dispatcher.dispatchEvent(event);
      });

      it('should call postMessage', () => {
        expect(messagePort.postMessage).toHaveBeenCalledTimes(1);
      });

      it('should wrap event into transfer package', () => {
        const pkg = messagePort.postMessage.mock.calls[0][0];
        expect(pkg.dispatcherId).toBe(dispatcher.dispatcherId);
        expect(JSON.parse(pkg.event)).toEqual(event);
      });

      it('should pass targetOrigin', () => {
        expect(messagePort.postMessage.mock.calls[0][1]).toBe(dispatcher.targetOrigin);
      });

      describe('When mirroring sent message', () => {
        beforeEach(() => {
          const pkg = messagePort.postMessage.mock.calls[0][0];
          messagePort.dispatchEvent({ type: 'message', data: pkg });
        });

        it('sender should catch message event', () => {
          expect(senderListener).toHaveBeenCalledTimes(1);
        });

        it('receiver should skip message event', () => {
          expect(receiverListener).not.toHaveBeenCalled();
        });

        it('message event should not be dispatcher from main interface', () => {
          expect(listener).not.toHaveBeenCalled();
        });
      });
    });

    describe('Receive events', () => {
      let pkg;
      let listener;
      let senderListener;
      let receiverListener;

      beforeEach(() => {
        pkg = {
          event: {
            type: 'myEvent',
            data: 'anything',
          },
          dispatcherId: 'password1',
        };
        listener = jest.fn();
        senderListener = jest.fn();
        receiverListener = jest.fn();
        dispatcher.addEventListener('myEvent', listener);
        dispatcher.sender.addEventListener('myEvent', senderListener);
        dispatcher.receiver.addEventListener('myEvent', receiverListener);
        messagePort.dispatchEvent('message', pkg);
      });

      it('sender should skip message event', () => {
        expect(senderListener).not.toHaveBeenCalled();
      });

      it('receiver should dispatch event', () => {
        expect(receiverListener).toHaveBeenCalledTimes(1);
      });

      it('message event should be dispatcher from main interface', () => {
        expect(listener).toHaveBeenCalledTimes(1);
      });

      it('should pass event object to listener', () => {
        expect(listener).toHaveBeenCalledWith(expect.objectContaining({
          type: 'myEvent',
          data: 'anything',
        }));
      });
    });
  });
});
