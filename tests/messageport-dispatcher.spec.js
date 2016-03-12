/**
 * Created by Oleg Galaburda on 15.02.16.
 */
describe('MessagePortDispatcher', function() {
  function MessagePortMock() {
    var _dispatcher = new EventDispatcher();
    this.addEventListener = sinon.spy(_dispatcher.addEventListener.bind(_dispatcher));
    this.hasEventListener = sinon.spy(_dispatcher.hasEventListener.bind(_dispatcher));
    this.removeEventListener = sinon.spy(_dispatcher.removeEventListener.bind(_dispatcher));
    this.dispatchEvent = _dispatcher.dispatchEvent.bind(_dispatcher);
    this.postMessage = sinon.spy();
  }

  var messagePort = null;
  var dispatcher = null;
  beforeEach(function() {
    messagePort = new MessagePortMock();
    dispatcher = new MessagePortDispatcher(messagePort);
  });

  describe('When using custom postMessage handler', function() {
    var customHandler = null;
    beforeEach(function() {
      customHandler = sinon.spy();
      dispatcher = new MessagePortDispatcher(messagePort, customHandler);
      dispatcher.dispatchEvent('any-event');
    });
    it('should call custom handler', function() {
      expect(customHandler).to.be.calledOnce;
    });
    it('should not call own handler', function() {
      expect(messagePort.postMessage).to.not.be.called;
    });
  });

  it('self() should create MessagePortDispatcher for current window', function() {
    expect(MessagePortDispatcher.self().target).to.be.equal(self);
  });

  it('parent() should create MessagePortDispatcher for parent window', function() {
    expect(MessagePortDispatcher.parent().target).to.be.equal(parent);
  });

  it('top() should create MessagePortDispatcher for top window', function() {
    expect(MessagePortDispatcher.top().target).to.be.equal(top);
  });

  describe('toJSON()', function() {
    describe('When toJSON is defined', function() {
      var object = null;
      var result = null;
      beforeEach(function() {
        object = {
          toJSON: sinon.spy(function() {
            return {};
          })
        };
        result = MessagePortDispatcher.toJSON(object);
      });
      it('should use object toJSON() method', function() {
        expect(object.toJSON).to.be.calledOnce;
      });
      it('should return object', function() {
        expect(result).to.be.an('object');
      });
    });
    describe('When toJSON isn\'t defined', function() {
      var object = null;
      var result = null;
      beforeEach(function() {
        object = {value: true, target: {}, type: 'anystring'};
        result = MessagePortDispatcher.toJSON(object);
      });
      it('should return string', function() {
        expect(result).to.be.an('string');
      });
      it('should return proper JSON', function() {
        expect(JSON.parse(result)).to.be.eql(object);
      });
    });
  });
  describe('parse()', function() {
    it('should accept object as parameter', function() {
      expect(MessagePortDispatcher.parse({something: '123'})).to.be.eql({something: '123'});
    });
    it('should accept string as parameter', function() {
      expect(MessagePortDispatcher.parse(JSON.stringify({something: '123'}))).to.be.eql({something: '123'});
    });
  });
  describe('Instance', function() {
    it('should have property with sender EventDispatcher', function() {
      expect(dispatcher.sender).to.be.an.instanceof(EventDispatcher);
    });
    it('should have property with receiver EventDispatcher', function() {
      expect(dispatcher.receiver).to.be.an.instanceof(EventDispatcher);
    });
    it('sender and receiver should not be same', function() {
      expect(dispatcher.sender).to.not.be.equal(dispatcher.receiver);
    });
    it('should have property with MessagePort', function() {
      expect(dispatcher.target).to.be.equal(messagePort);
    });
    it('should have unique Id', function() {
      expect(dispatcher.dispatcherId).to.be.a('string');
    });
    describe('Send events', function() {
      var event = null;
      var listener = null;
      var senderListener = null;
      var receiverListener = null;
      beforeEach(function() {
        listener = sinon.spy();
        senderListener = sinon.spy();
        receiverListener = sinon.spy();
        event = {type: 'myEvent', data: 'anything'};
        dispatcher.addEventListener('myEvent', listener);
        dispatcher.sender.addEventListener('myEvent', senderListener);
        dispatcher.receiver.addEventListener('myEvent', receiverListener);
        dispatcher.dispatchEvent(event);
      });
      it('should call postMessage', function() {
        expect(messagePort.postMessage).to.be.calledOnce;
      });
      it('should wrap event into transfer package', function() {
        var pkg = messagePort.postMessage.getCall(0).args[0];
        expect(pkg.dispatcherId).to.be.equal(dispatcher.dispatcherId);
        expect(JSON.parse(pkg.event)).to.be.eql(event);
      });
      it('should pass targetOrigin', function() {
        expect(messagePort.postMessage.getCall(0).args[1]).to.be.equal(dispatcher.targetOrigin);
      });
      describe('When mirroring sent message', function() {
        beforeEach(function() {
          var pkg = messagePort.postMessage.getCall(0).args[0];
          messagePort.dispatchEvent({type: 'message', data: pkg});
        });
        it('sender should catch message event', function() {
          expect(senderListener).to.be.calledOnce;
        });
        it('receiver should skip message event', function() {
          expect(receiverListener).to.not.be.called;
        });
        it('message event should not be dispatcher from main interface', function() {
          expect(listener).to.not.be.called;
        });
      });
    });

    describe('Receive events', function() {
      var pkg = null;
      var listener = null;
      var senderListener = null;
      var receiverListener = null;
      beforeEach(function() {
        pkg = {
          event: {
            type: 'myEvent',
            data: 'anything'
          },
          dispatcherId: 'password1'
        };
        listener = sinon.spy();
        senderListener = sinon.spy();
        receiverListener = sinon.spy();
        dispatcher.addEventListener('myEvent', listener);
        dispatcher.sender.addEventListener('myEvent', senderListener);
        dispatcher.receiver.addEventListener('myEvent', receiverListener);
        messagePort.dispatchEvent('message', pkg);
      });
      it('sender should skip message event', function() {
        expect(senderListener).to.not.be.called;
      });
      it('receiver should dispatch event', function() {
        expect(receiverListener).to.be.calledOnce;
      });
      it('message event should be dispatcher from main interface', function() {
        expect(listener).to.be.calledOnce;
      });
      it('should pass event object to listener', function() {
        var event = listener.getCall(0).args[0];
        expect(event.type).to.be.equal('myEvent');
        expect(event.data).to.be.equal('anything');
      });
    });
  });
});
