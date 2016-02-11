/**
 * Created by Oleg Galaburda on 09.02.16.
 */

var MessagePortEvent = (function() {


  function MessagePortEvent(event, dispatcherId) {
    this.event = event;
    this.dispatcherId = dispatcherId;
  }

  function toJSON() {
    return {
      event: MessagePortDispatcher.toJSON(this.event),
      dispatcherId: this.dispatcherId
    };
  }
  MessagePortEvent.prototype.toJSON = toJSON;

  function fromJSON(object) {
    var result = MessagePortDispatcher.fromJSON(object);
    if (MessagePortEvent.isEvent(object)) {
      result.event = MessagePortDispatcher.fromJSON(result.event);
    } else {
      result = null;
    }
    return result;
  }
  MessagePortEvent.fromJSON = fromJSON;

  function isEvent(object) {
    return EventDispatcher.isObject(object) && object.hasOwnProperty('dispatcherId') && object.hasOwnProperty('event');
  }
  MessagePortEvent.isEvent = isEvent;

  return MessagePortEvent;
})();

/**
 *
 * @param port {Window|Worker|MessagePort}
 * @constructor
 */
function MessagePortDispatcher(target, customPostMessageHandler) {
  target = target || self;
  var _dispatcherId = 'MP/' + String(Math.ceil(Math.random() * 10000)) + '/' + String(Date.now());
  var postMessageHandler = customPostMessageHandler || function(data, transferList) {
      target.postMessage(data, this.targetOrigin, transferList);
    };
  /**
   * @type {EventDispatcher}
   */
  var _sender = new EventDispatcher();
  /**
   * @type {EventDispatcher}
   */
  var _receiver = new EventDispatcher();

  function messageHandler(event) {
    var message = MessagePortEvent.fromJSON(event.data);
    if (message) {
      if (message.dispatcherId === _dispatcherId) {
        _sender.dispatchEvent(message.event);
      } else {
        _receiver.dispatchEvent(message.event);
      }
    }
  }

  function dispatchEvent(event, data, transferList) {
    event = EventDispatcher.getEvent(event, data);
    var eventJson = MessagePortDispatcher.toJSON(new MessagePortEvent(event, _dispatcherId));
    postMessageHandler.call(this, eventJson, transferList);
  }

  this.targetOrigin = '*';
  this.addEventListener = _receiver.addEventListener;
  this.hasEventListener = _receiver.hasEventListener;
  this.removeEventListener = _receiver.removeEventListener;
  this.removeAllEventListeners = _receiver.removeAllEventListeners;
  this.dispatchEvent = dispatchEvent;

  Object.defineProperties(this, {
    sender: {
      value: _sender
    },
    receiver: {
      value: _receiver
    },
    target: {
      value: target
    },
    dispatcherId: {
      value: _dispatcherId
    }
  });

  target.addEventListener('message', messageHandler);
}


MessagePortDispatcher.toJSON = function(object) {
  var objectJson;
  if (typeof(object.toJSON) === 'function') {
    objectJson = object.toJSON();
  } else {
    objectJson = JSON.stringify(object);
  }
  return objectJson;
};

MessagePortDispatcher.fromJSON = function(data) {
  var object; // keep it undefined in case of error
  if (EventDispatcher.isObject(data)) {
    object = data;
  } else {
    try {
      object = JSON.parse(data);
    } catch (error) {
      // this isn't an event we are waiting for.
    }
  }
  return object;
};

var _self = null;
var _parent = null;
var _top = null;
MessagePortDispatcher.self = function() {
  if (!_self) {
    _self = new MessagePortDispatcher(self);
  }
  return _self;
};

MessagePortDispatcher.parent = function() {
  if (!_parent) {
    _parent = new MessagePortDispatcher(parent);
  }
  return _parent;
};

MessagePortDispatcher.top = function() {
  if (!_top) {
    _top = new MessagePortDispatcher(top);
  }
  return _top;
};
