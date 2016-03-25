/**
 * Created by Oleg Galaburda on 09.12.15.
 */
// Uses Node, AMD or browser globals to create a module.
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['event-dispatcher'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // Node. Does not work with strict CommonJS, but
    // only CommonJS-like environments that support module.exports,
    // like Node.
    module.exports = factory(require('event-dispatcher'));
  } else {
    // Browser globals (root is window)
    root.MessagePortDispatcher = factory(root.EventDispatcher);
  }
}(this, function (EventDispatcher) {
  // here should be injected messageport-dispatcher.js content
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
  
    function parse(object) {
      var result = MessagePortDispatcher.parse(object);
      if (MessagePortEvent.isEvent(result)) {
        result.event = MessagePortDispatcher.parse(result.event);
      } else {
        result = null;
      }
      return result;
    }
  
    MessagePortEvent.parse = parse;
  
    function isEvent(object) {
      return EventDispatcher.isObject(object) && object.hasOwnProperty('dispatcherId') && object.hasOwnProperty('event');
    }
  
    MessagePortEvent.isEvent = isEvent;
  
    return MessagePortEvent;
  })();
  
  /**
   *
   * @param target {Window|Worker|MessagePort}
   * @param customPostMessageHandler {?Function} Function that receive message object and pass it to MessagePort.postMessage()
   * @param receiverEventPreprocessor {?Function} Function that pre-process all events received from MessagePort, before passing to listeners
   * @param senderEventPreprocessor Function that pre-process all events sent to MessagePort
   * @constructor
   */
  var MessagePortDispatcher = (function() {
    var NOINIT = {};
    var HANDLERS_FIELD = Symbol('message.port.dispatcher::handlers');
  
    function MessagePortDispatcher(target, customPostMessageHandler, receiverEventPreprocessor, senderEventPreprocessor) {
      if (target === NOINIT) {
        return;
      }
      target = target || self;
      this[HANDLERS_FIELD] = {
        customPostMessageHandler: customPostMessageHandler,
        senderEventPreprocessor: senderEventPreprocessor
      };
  
      Object.defineProperties(this, {
        /**
         * @type {EventDispatcher}
         */
        sender: {
          value: EventDispatcher.create()
        },
        /**
         * @type {EventDispatcher}
         */
        receiver: {
          value: EventDispatcher.create(receiverEventPreprocessor)
        },
        target: {
          value: target
        },
        dispatcherId: {
          value: 'MP/' + String(Math.ceil(Math.random() * 10000)) + '/' + String(Date.now())
        }
      });
  
      this.targetOrigin = '*';
      this.addEventListener = this.receiver.addEventListener.bind(this.receiver);
      this.hasEventListener = this.receiver.hasEventListener.bind(this.receiver);
      this.removeEventListener = this.receiver.removeEventListener.bind(this.receiver);
      this.removeAllEventListeners = this.receiver.removeAllEventListeners.bind(this.receiver);
  
      target.addEventListener('message', this._messageEventListener.bind(this));
    }
  
    function _dispatchEvent(event, data, transferList) {
      event = EventDispatcher.getEvent(event, data);
      if (this[HANDLERS_FIELD].senderEventPreprocessor) {
        event = this[HANDLERS_FIELD].senderEventPreprocessor.call(this, event);
      }
      var eventJson = MessagePortDispatcher.toJSON(new MessagePortEvent(event, this.dispatcherId));
      this._postMessageHandler(eventJson, transferList);
    }
  
    function __postMessageHandler(data, transferList) {
      var handler = this[HANDLERS_FIELD].customPostMessageHandler;
      if (handler) {
        handler.call(this, data, transferList);
      } else {
        this.target.postMessage(data, this.targetOrigin, transferList);
      }
    }
  
    function __messageEventListener(event) {
      var message = MessagePortEvent.parse(event.data);
      if (message) {
        if (message.dispatcherId === this.dispatcherId) {
          this.sender.dispatchEvent(message.event);
        } else {
          this.receiver.dispatchEvent(message.event);
        }
      }
    }
  
    MessagePortDispatcher.prototype = EventDispatcher.createNoInitPrototype();
    MessagePortDispatcher.prototype.constructor = MessagePortDispatcher;
    MessagePortDispatcher.prototype.dispatchEvent = _dispatchEvent;
    /**
     * @private
     */
    MessagePortDispatcher.prototype._messageEventListener = __messageEventListener;
    /**
     * @private
     */
    MessagePortDispatcher.prototype._postMessageHandler = __postMessageHandler;
  
    //----------------- static
  
    var _self = null;
    var _parent = null;
    var _top = null;
  
    function MessagePortDispatcher_toJSON(object) {
      var objectJson;
      if (typeof(object.toJSON) === 'function') {
        objectJson = object.toJSON();
      } else {
        objectJson = JSON.stringify(object);
      }
      return objectJson;
    }
  
    function MessagePortDispatcher_parse(data) {
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
    }
  
    function MessagePortDispatcher_self() {
      if (!_self) {
        _self = new MessagePortDispatcher(self);
      }
      return _self;
    }
  
    function MessagePortDispatcher_parent() {
      if (!_parent) {
        _parent = new MessagePortDispatcher(parent);
      }
      return _parent;
    }
  
    function MessagePortDispatcher_top() {
      if (!_top) {
        _top = new MessagePortDispatcher(top);
      }
      return _top;
    }
  
    function MessagePortDispatcher_create(target, customPostMessageHandler, receiverEventPreprocessor, senderEventPreprocessor) {
      return new MessagePortDispatcher(target, customPostMessageHandler, receiverEventPreprocessor, senderEventPreprocessor);
    }
  
    function MessagePortDispatcher_createNoInitPrototype() {
      return new MessagePortDispatcher(NOINIT);
    }
  
    /**
     * If toJSON method implemented on object, it will be called instead of converting to JSON string.
     * This was made to utilize structured cloning algorithm for raw objects.
     * https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm
     * In this case developer is responsible for converting linked objects.
     * @param object
     * @returns {Object|String}
     */
    MessagePortDispatcher.toJSON = MessagePortDispatcher_toJSON;
    /**
     *
     * @param data {Object|String}
     * @returns {Object}
     */
    MessagePortDispatcher.parse = MessagePortDispatcher_parse;
    /**
     * @returns {MessagePortDispatcher}
     */
    MessagePortDispatcher.self = MessagePortDispatcher_self;
    /**
     * @returns {MessagePortDispatcher}
     */
    MessagePortDispatcher.parent = MessagePortDispatcher_parent;
    /**
     * @returns {MessagePortDispatcher}
     */
    MessagePortDispatcher.top = MessagePortDispatcher_top;
    MessagePortDispatcher.create = MessagePortDispatcher_create;
    MessagePortDispatcher.createNoInitPrototype = MessagePortDispatcher_createNoInitPrototype;
  
    return MessagePortDispatcher;
  })();
  
  return MessagePortDispatcher;
}));
