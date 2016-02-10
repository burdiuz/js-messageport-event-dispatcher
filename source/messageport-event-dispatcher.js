/**
 * Created by Oleg Galaburda on 09.02.16.
 */

/**
 *
 * @param port {Window|Worker|MessagePort}
 * @constructor
 */
function MessagePortDispatcher(target) {
  target = target || self;
  /**
   * @type {EventDispatcher}
   */
  var _sender = new EventDispatcher();
  /**
   * @type {EventDispatcher}
   */
  var _receiver = new EventDispatcher();

  function messageHandler(event) {
    var messageEvent = MessagePortDispatcher.fromJSON(event.data);
    if (EventDispatcher.isObject(messageEvent) && messageEvent.hasOwnProperty('type')) {
      _receiver.dispatchEvent(messageEvent);
    }

  }

  function dispatchEvent(event, data, transferList) {
    event = EventDispatcher.getEvent(event, data);
    var eventJson = MessagePortDispatcher.toJSON(event);
    port.postMessage(eventJson, transferList);
    _sender.dispatchEvent(event);
  }

  this.addEventListener = _receiver.addEventListener;
  this.hasEventListener = _receiver.hasEventListener;
  this.removeEventListener = _receiver.removeEventListener;
  this.removeAllEventListeners = _receiver.removeAllEventListeners;
  this.dispatchEvent = dispatchEvent;

  Object.defineProperties(this, {
    sender: {
      value: _sender,
      enumerable: false
    },
    receiver: {
      value: _receiver,
      enumerable: false
    },
    target: {
      value: target,
      enumerable: false
    }
  });

  target.addEventListener('message', messageHandler);
}


MessagePortDispatcher.toJSON = function(object) {
  var objectJson;
  if (object.hasOwnProperty('toJSON') && typeof(object.toJSON) === 'function') {
    objectJson = event.toJSON();
  } else {
    objectJson = JSON.stringify(event);
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
    return object;
  }
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
