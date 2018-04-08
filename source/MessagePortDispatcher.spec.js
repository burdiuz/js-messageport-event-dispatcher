/**
 * Created by Oleg Galaburda on 15.02.16.
 */

import EventDispatcher from '@actualwave/event-dispatcher';
import MessagePortDispatcher from './index';

describe('MessagePortDispatcher', () => {
  function MessagePortMock() {
    const _dispatcher = new EventDispatcher();
    this.addEventListener = sinon.spy(_dispatcher.addEventListener.bind(_dispatcher));
    this.hasEventListener = sinon.spy(_dispatcher.hasEventListener.bind(_dispatcher));
    this.removeEventListener = sinon.spy(_dispatcher.removeEventListener.bind(_dispatcher));
    this.dispatchEvent = _dispatcher.dispatchEvent.bind(_dispatcher);
    this.postMessage = sinon.spy();
  }

  let messagePort = null;
  let dispatcher = null;
  beforeEach(() => {
    messagePort = new MessagePortMock();
    dispatcher = new MessagePortDispatcher(messagePort);
  });

  describe('When using custom postMessage handler', () => {
    let customHandler = null;
    beforeEach(() => {
      customHandler = sinon.spy();
      dispatcher = new MessagePortDispatcher(messagePort, customHandler);
      dispatcher.dispatchEvent('any-event');
    });
    it('should call custom handler', () => {
      expect(customHandler).to.be.calledOnce;
    });
    it('should not call own handler', () => {
      expect(messagePort.postMessage).to.not.be.called;
    });
  });

  it('self() should create MessagePortDispatcher for current window', () => {
    expect(MessagePortDispatcher.self().target).to.be.equal(self);
  });

  it('parent() should create MessagePortDispatcher for parent window', () => {
    expect(MessagePortDispatcher.parent().target).to.be.equal(parent);
  });

  it('top() should create MessagePortDispatcher for top window', () => {
    expect(MessagePortDispatcher.top().target).to.be.equal(top);
  });

  describe('When using pre-processors', () => {
    let dispatcher;
    let sendPreprocessor;
    let recieverPreprocessor;
    beforeEach(() => {
      sendPreprocessor = sinon.spy((event) => event);
      recieverPreprocessor = sinon.spy((event) => event);
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
        expect(sendPreprocessor).to.be.calledOnce;
        expect(sendPreprocessor.getCall(0).args[0].type).to.be.equal('sentEvent');
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
        expect(recieverPreprocessor).to.be.calledOnce;
        expect(recieverPreprocessor.getCall(0).args[0].type).to.be.equal('receivedEvent');
      });
    });
  });

  describe('toJSON()', () => {
    describe('When toJSON is defined', () => {
      let object = null;
      let result = null;
      beforeEach(() => {
        object = {
          toJSON: sinon.spy(() => ({})),
        };
        result = MessagePortDispatcher.toJSON(object);
      });
      it('should use object toJSON() method', () => {
        expect(object.toJSON).to.be.calledOnce;
      });
      it('should return object', () => {
        expect(result).to.be.an('object');
      });
    });
    describe('When toJSON isn\'t defined', () => {
      let object = null;
      let result = null;
      beforeEach(() => {
        object = { value: true, target: {}, type: 'anystring' };
        result = MessagePortDispatcher.toJSON(object);
      });
      it('should return string', () => {
        expect(result).to.be.an('string');
      });
      it('should return proper JSON', () => {
        expect(JSON.parse(result)).to.be.eql(object);
      });
    });
  });
  describe('parse()', () => {
    it('should accept object as parameter', () => {
      expect(MessagePortDispatcher.parse({ something: '123' })).to.be.eql({ something: '123' });
    });
    it('should accept string as parameter', () => {
      expect(MessagePortDispatcher.parse(JSON.stringify({ something: '123' }))).to.be.eql({ something: '123' });
    });
  });
  describe('create()', () => {
    let dispatcher;
    let customHandler;
    let sendPreprocessor;
    let recieverPreprocessor;
    beforeEach(() => {
      customHandler = sinon.spy();
      sendPreprocessor = sinon.spy((event) => event);
      recieverPreprocessor = sinon.spy((event) => event);
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
      expect(dispatcher).to.be.an.instanceof(MessagePortDispatcher);
    });
    it('should save custom handler', () => {
      expect(customHandler).to.be.calledOnce;
      expect(customHandler.getCall(0).args[0].event.type).to.be.equal('sentEvent');
    });
    it('should call preprocessor for sent event', () => {
      expect(sendPreprocessor).to.be.calledOnce;
      expect(sendPreprocessor.getCall(0).args[0].type).to.be.equal('sentEvent');
    });
    it('should call preprocessor for received event', () => {
      expect(recieverPreprocessor).to.be.calledOnce;
      expect(recieverPreprocessor.getCall(0).args[0].type).to.be.equal('receivedEvent');
    });
  });
  describe('Instance', () => {
    it('should have property with sender EventDispatcher', () => {
      expect(dispatcher.sender).to.be.an.instanceof(EventDispatcher);
    });
    it('should have property with receiver EventDispatcher', () => {
      expect(dispatcher.receiver).to.be.an.instanceof(EventDispatcher);
    });
    it('sender and receiver should not be same', () => {
      expect(dispatcher.sender).to.not.be.equal(dispatcher.receiver);
    });
    it('should have property with MessagePort', () => {
      expect(dispatcher.target).to.be.equal(messagePort);
    });
    it('should have unique Id', () => {
      expect(dispatcher.dispatcherId).to.be.a('string');
    });
    describe('Send events', () => {
      let event = null;
      let listener = null;
      let senderListener = null;
      let receiverListener = null;
      beforeEach(() => {
        listener = sinon.spy();
        senderListener = sinon.spy();
        receiverListener = sinon.spy();
        event = { type: 'myEvent', data: 'anything' };
        dispatcher.addEventListener('myEvent', listener);
        dispatcher.sender.addEventListener('myEvent', senderListener);
        dispatcher.receiver.addEventListener('myEvent', receiverListener);
        dispatcher.dispatchEvent(event);
      });
      it('should call postMessage', () => {
        expect(messagePort.postMessage).to.be.calledOnce;
      });
      it('should wrap event into transfer package', () => {
        const pkg = messagePort.postMessage.getCall(0).args[0];
        expect(pkg.dispatcherId).to.be.equal(dispatcher.dispatcherId);
        expect(JSON.parse(pkg.event)).to.be.eql(event);
      });
      it('should pass targetOrigin', () => {
        expect(messagePort.postMessage.getCall(0).args[1]).to.be.equal(dispatcher.targetOrigin);
      });
      describe('When mirroring sent message', () => {
        beforeEach(() => {
          const pkg = messagePort.postMessage.getCall(0).args[0];
          messagePort.dispatchEvent({ type: 'message', data: pkg });
        });
        it('sender should catch message event', () => {
          expect(senderListener).to.be.calledOnce;
        });
        it('receiver should skip message event', () => {
          expect(receiverListener).to.not.be.called;
        });
        it('message event should not be dispatcher from main interface', () => {
          expect(listener).to.not.be.called;
        });
      });
    });

    describe('Receive events', () => {
      let pkg = null;
      let listener = null;
      let senderListener = null;
      let receiverListener = null;
      beforeEach(() => {
        pkg = {
          event: {
            type: 'myEvent',
            data: 'anything',
          },
          dispatcherId: 'password1',
        };
        listener = sinon.spy();
        senderListener = sinon.spy();
        receiverListener = sinon.spy();
        dispatcher.addEventListener('myEvent', listener);
        dispatcher.sender.addEventListener('myEvent', senderListener);
        dispatcher.receiver.addEventListener('myEvent', receiverListener);
        messagePort.dispatchEvent('message', pkg);
      });
      it('sender should skip message event', () => {
        expect(senderListener).to.not.be.called;
      });
      it('receiver should dispatch event', () => {
        expect(receiverListener).to.be.calledOnce;
      });
      it('message event should be dispatcher from main interface', () => {
        expect(listener).to.be.calledOnce;
      });
      it('should pass event object to listener', () => {
        const event = listener.getCall(0).args[0];
        expect(event.type).to.be.equal('myEvent');
        expect(event.data).to.be.equal('anything');
      });
    });
  });
});
