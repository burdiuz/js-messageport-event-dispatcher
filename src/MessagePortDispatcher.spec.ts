/* eslint-disable no-restricted-globals */
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import EventDispatcher from '@actualwave/event-dispatcher';
import {
  MessagePortDispatcher,
  createMessagePortDispatcher,
  getForSelf,
  getForParent,
  getForTop,
} from './index';

type MockTarget = EventDispatcher & { postMessage: jest.Mock };

describe('MessagePortDispatcher', () => {
  let messagePort: MockTarget;
  let dispatcher: MessagePortDispatcher;

  beforeEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const g = globalThis as any;
    const makeWindowMock = () => ({ addEventListener: jest.fn(), removeEventListener: jest.fn(), postMessage: jest.fn() });
    // Only set once so the singleton factories capture a stable reference
    if (!g.__mockWindowsSet) {
      g.self = makeWindowMock();
      g.parent = makeWindowMock();
      g.top = makeWindowMock();
      g.__mockWindowsSet = true;
    }

    messagePort = Object.assign(new EventDispatcher(), { postMessage: jest.fn() }) as MockTarget;
    jest.spyOn(messagePort, 'addEventListener');
    jest.spyOn(messagePort, 'hasEventListener');
    jest.spyOn(messagePort, 'removeEventListener');
    jest.spyOn(messagePort, 'dispatchEvent');

    dispatcher = new MessagePortDispatcher(messagePort as any);
  });

  describe('When using custom postMessage handler', () => {
    let customHandler: jest.Mock;

    beforeEach(() => {
      customHandler = jest.fn();
      dispatcher = new MessagePortDispatcher(messagePort as any, customHandler as any);
      dispatcher.dispatchEvent('any-event');
    });

    it('should call custom handler', () => {
      expect(customHandler).toHaveBeenCalledTimes(1);
    });

    it('should not call own handler', () => {
      expect(messagePort.postMessage).not.toHaveBeenCalled();
    });
  });

  it('getForSelf() should create MessagePortDispatcher for current window', () => {
    const selfDispatcher = getForSelf();
    expect(selfDispatcher.target).toBe((globalThis as any).self);
    expect(getForSelf()).toBe(selfDispatcher);
  });

  it('getForParent() should create MessagePortDispatcher for parent window', () => {
    expect(getForParent().target).toBe((globalThis as any).parent);
  });

  it('getForTop() should create MessagePortDispatcher for top window', () => {
    expect(getForTop().target).toBe((globalThis as any).top);
  });

  describe('When created with no arguments', () => {
    it('should use global self as target', () => {
      expect(new MessagePortDispatcher().target).toBe((globalThis as any).self);
    });
  });

  describe('When using pre-processors', () => {
    let sendPreprocessor: jest.Mock;
    let receiverPreprocessor: jest.Mock;

    beforeEach(() => {
      sendPreprocessor = jest.fn((event) => event);
      receiverPreprocessor = jest.fn((event) => event);
      dispatcher = new MessagePortDispatcher(
        messagePort as any,
        null,
        receiverPreprocessor as any,
        sendPreprocessor as any,
      );
    });

    describe('When sending event', () => {
      beforeEach(() => {
        dispatcher.dispatchEvent('sentEvent');
      });

      it('should call preprocessor for sent event', () => {
        expect(sendPreprocessor).toHaveBeenCalledTimes(1);
        expect(sendPreprocessor).toHaveBeenCalledWith(
          expect.objectContaining({ type: 'sentEvent' }),
        );
      });
    });

    describe('When receiving event', () => {
      beforeEach(() => {
        messagePort.dispatchEvent('message', {
          event: { type: 'receivedEvent', data: null },
          dispatcherId: 'not-this-dispatcher',
        });
      });

      it('should call preprocessor for received event', () => {
        expect(receiverPreprocessor).toHaveBeenCalledTimes(1);
        expect(receiverPreprocessor).toHaveBeenCalledWith(
          expect.objectContaining({ type: 'receivedEvent' }),
        );
      });
    });
  });

  describe('createMessagePortDispatcher()', () => {
    let customHandler: jest.Mock;
    let sendPreprocessor: jest.Mock;
    let receiverPreprocessor: jest.Mock;

    beforeEach(() => {
      customHandler = jest.fn();
      sendPreprocessor = jest.fn((event) => event);
      receiverPreprocessor = jest.fn((event) => event);
      dispatcher = createMessagePortDispatcher(
        messagePort as any,
        customHandler as any,
        receiverPreprocessor as any,
        sendPreprocessor as any,
      );

      dispatcher.dispatchEvent('sentEvent');
      messagePort.dispatchEvent('message', {
        event: { type: 'receivedEvent', data: null },
        dispatcherId: 'not-this-dispatcher',
      });
    });

    it('should create dispatcher', () => {
      expect(dispatcher).toBeInstanceOf(MessagePortDispatcher);
    });

    it('should save custom handler', () => {
      expect(customHandler).toHaveBeenCalledTimes(1);
      const pkg = customHandler.mock.calls[0][0] as any;
      expect(JSON.parse(pkg.event)).toMatchObject({ type: 'sentEvent' });
    });

    it('should call preprocessor for sent event', () => {
      expect(sendPreprocessor).toHaveBeenCalledTimes(1);
      expect((sendPreprocessor.mock.calls[0] as unknown[])[0]).toEqual(
        expect.objectContaining({ type: 'sentEvent' }),
      );
    });

    it('should call preprocessor for received event', () => {
      expect(receiverPreprocessor).toHaveBeenCalledTimes(1);
      expect((receiverPreprocessor.mock.calls[0] as unknown[])[0]).toEqual(
        expect.objectContaining({ type: 'receivedEvent' }),
      );
    });
  });

  describe('Instance', () => {
    it('should have property with sender EventDispatcher', () => {
      expect(dispatcher.sender).toBeDefined();
    });

    it('should have property with receiver EventDispatcher', () => {
      expect(dispatcher.receiver).toBeDefined();
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
      let event: { type: string; data: string };
      let listener: jest.Mock;
      let senderListener: jest.Mock;
      let receiverListener: jest.Mock;

      beforeEach(() => {
        listener = jest.fn();
        senderListener = jest.fn();
        receiverListener = jest.fn();
        event = { type: 'myEvent', data: 'anything' };
        dispatcher.addEventListener('myEvent', listener as any);
        dispatcher.sender.addEventListener('myEvent', senderListener as any);
        dispatcher.receiver.addEventListener('myEvent', receiverListener as any);
        dispatcher.dispatchEvent(event);
      });

      it('should have listeners for "myEvent"', () => {
        expect(dispatcher.hasEventListener('myEvent')).toBe(true);
      });

      it('should call postMessage', () => {
        expect(messagePort.postMessage).toHaveBeenCalledTimes(1);
      });

      it('should wrap event into transfer package', () => {
        const pkg = messagePort.postMessage.mock.calls[0][0] as any;
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

        it('message event should not be dispatched from main interface', () => {
          expect(listener).not.toHaveBeenCalled();
        });
      });
    });

    describe('Receive events', () => {
      let pkg: { event: { type: string; data: string }; dispatcherId: string };
      let listener: jest.Mock;
      let senderListener: jest.Mock;
      let receiverListener: jest.Mock;

      beforeEach(() => {
        pkg = {
          event: { type: 'myEvent', data: 'anything' },
          dispatcherId: 'password1',
        };
        listener = jest.fn();
        senderListener = jest.fn();
        receiverListener = jest.fn();
        dispatcher.addEventListener('myEvent', listener as any);
        dispatcher.sender.addEventListener('myEvent', senderListener as any);
        dispatcher.receiver.addEventListener('myEvent', receiverListener as any);
        messagePort.dispatchEvent('message', pkg);
      });

      it('should have listeners for "myEvent"', () => {
        expect(dispatcher.hasEventListener('myEvent')).toBe(true);
      });

      it('sender should skip message event', () => {
        expect(senderListener).not.toHaveBeenCalled();
      });

      it('receiver should dispatch event', () => {
        expect(receiverListener).toHaveBeenCalledTimes(1);
      });

      it('message event should be dispatched from main interface', () => {
        expect(listener).toHaveBeenCalledTimes(1);
      });

      it('should pass event object to listener', () => {
        expect(listener).toHaveBeenCalledWith(
          expect.objectContaining({ type: 'myEvent', data: 'anything' }),
        );
      });

      describe('When listener removed', () => {
        beforeEach(() => {
          listener.mockClear();
          receiverListener.mockClear();
          senderListener.mockClear();
          dispatcher.removeEventListener('myEvent', listener as any);
          messagePort.dispatchEvent('message', pkg);
        });

        it('sender should skip message event', () => {
          expect(senderListener).not.toHaveBeenCalled();
        });

        it('receiver should dispatch event', () => {
          expect(receiverListener).toHaveBeenCalledTimes(1);
        });

        it('should not call event listener', () => {
          expect(listener).not.toHaveBeenCalled();
        });
      });

      describe('When all listeners removed', () => {
        beforeEach(() => {
          listener.mockClear();
          receiverListener.mockClear();
          senderListener.mockClear();
          dispatcher.removeAllEventListeners('myEvent');
          messagePort.dispatchEvent('message', pkg);
        });

        it('should not call any event listener', () => {
          expect(listener).not.toHaveBeenCalled();
          expect(senderListener).not.toHaveBeenCalled();
          expect(receiverListener).not.toHaveBeenCalled();
        });
      });
    });
  });
});
