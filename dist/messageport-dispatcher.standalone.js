/**
 * Created by Oleg Galaburda on 09.12.15.
 */
// Uses Node, AMD or browser globals to create a module.
(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    // Node. Does not work with strict CommonJS, but
    // only CommonJS-like environments that support module.exports,
    // like Node.
    module.exports = factory();
  } else {
    // Browser globals (root is window)
    root.MessagePortDispatcher = factory();
  }
}(this, function() {
  var EventDispatcher = (function() {
    /**
     * Created by Oleg Galaburda on 09.02.16.
     */
    
    var Event = (function() {
    
      function toJSON() {
        return {type: this.type, data: this.data};
      }
    
      function Event(type, data) {
        var _defaultPrevented = false;
    
        function isDefaultPrevented() {
          return _defaultPrevented;
        }
    
        function preventDefault() {
          _defaultPrevented = true;
        }
    
        Object.defineProperties(this, {
          type: {
            value: type,
            enumerable: true
          },
          data: {
            value: data || null,
            enumerable: true
          }
        });
        this.preventDefault = preventDefault;
        this.isDefaultPrevented = isDefaultPrevented;
      }
    
      Event.prototype.toJSON = toJSON;
    
      return Event;
    })();
    
    var EventListeners = (function() {
      function add(eventType, handler, priority) {
        var handlers = createList(eventType, priority, this._listeners);
        if (handlers.indexOf(handler) < 0) {
          handlers.push(handler);
        }
      }
    
      function has(eventType) {
        var result = false;
        var priorities = getHashByKey(eventType, this._listeners);
        if (priorities) {
          for (var priority in priorities) {
            if (priorities.hasOwnProperty(priority)) {
              result = true;
              break;
            }
          }
        }
        return result;
      }
    
      function remove(eventType, handler) {
        var priorities = getHashByKey(eventType, this._listeners);
        if (priorities) {
          var list = Object.getOwnPropertyNames(priorities);
          var length = list.length;
          for (var index = 0; index < length; index++) {
            var priority = list[index];
            var handlers = priorities[priority];
            var handlerIndex = handlers.indexOf(handler);
            if (handlerIndex >= 0) {
              handlers.splice(handlerIndex, 1);
              if (!handlers.length) {
                delete priorities[priority];
              }
            }
          }
        }
      }
    
      function removeAll(eventType) {
        delete this._listeners[eventType];
      }
    
      function call(event, target) {
        var _stopped = false;
        var _immediatelyStopped = false;
    
        function stopPropagation() {
          _stopped = true;
        }
    
        function stopImmediatePropagation() {
          _immediatelyStopped = true;
        }
    
        /*
         * Three ways to implement this
         * 1. As its now -- just assign and delete after event cycle finished
         * 2. Use EventDispatcher.setupOptional()
         * 3. In this method create function StoppableEvent that will extend from this event and add these functions,
         *    then instantiate it for this one cycle.
         */
        event.stopPropagation = stopPropagation;
        event.stopImmediatePropagation = stopImmediatePropagation;
        /*
         var rmStopPropagation = EventDispatcher.setupOptional(event, 'stopPropagation', stopPropagation);
         var rmStopImmediatePropagation = EventDispatcher.setupOptional(event, 'stopImmediatePropagation', stopImmediatePropagation);
         */
        var priorities = getHashByKey(event.type, this._listeners);
        if (priorities) {
          var list = Object.getOwnPropertyNames(priorities).sort(function(a, b) {
            return a - b;
          });
          var length = list.length;
          for (var index = 0; index < length; index++) {
            if (_stopped) break;
            var handlers = priorities[list[index]];
            var handlersLength = handlers.length;
            for (var handlersIndex = 0; handlersIndex < handlersLength; handlersIndex++) {
              if (_immediatelyStopped) break;
              var handler = handlers[handlersIndex];
              handler.call(target, event);
            }
          }
        }
        delete event.stopPropagation;
        delete event.stopImmediatePropagation;
        /*
         rmStopPropagation();
         rmStopImmediatePropagation();
         */
      }
    
      function createList(eventType, priority, target) {
        var priorities = getHashByKey(eventType, target, Object);
        return getHashByKey(parseInt(priority), priorities, Array);
      }
    
      function getHashByKey(key, target, definition) {
        var value = null;
        if (target.hasOwnProperty(key)) {
          value = target[key];
        } else if (definition) {
          value = target[key] = new definition();
        }
        return value;
      }
    
      function EventListeners() {
        /**
         * key - event Type
         * value - hash of priorities
         *    key - priority
         *    value - list of handlers
         * @type {Object<string, Object.<string, Array<number, Function>>>}
         * @private
         */
        this._listeners = {};
      }
    
      EventListeners.prototype.add = add;
      EventListeners.prototype.has = has;
      EventListeners.prototype.remove = remove;
      EventListeners.prototype.removeAll = removeAll;
      EventListeners.prototype.call = call;
    
      return EventListeners;
    })();
    
    var EVENTDISPATCHER_NOINIT = {};
    
    /**
     *
     * @param eventPreprocessor {?Function}
     * @constructor
     */
    var EventDispatcher = (function() {
    
      var LISTENERS_FIELD = Symbol('event.dispatcher::listeners');
    
      var PREPROCESSOR_FIELD = Symbol('event.dispatcher::preprocessor');
    
      function EventDispatcher(eventPreprocessor) {
        if (eventPreprocessor === EVENTDISPATCHER_NOINIT) {
          // create noinit prototype
          return;
        }
        /**
         * @type {EventListeners}
         */
        Object.defineProperty(this, LISTENERS_FIELD, {
          value: new EventListeners()
        });
        Object.defineProperty(this, PREPROCESSOR_FIELD, {
          value: eventPreprocessor
        });
      }
    
    
      function _addEventListener(eventType, listener, priority) {
        this[LISTENERS_FIELD].add(eventType, listener, -priority || 0);
      }
    
      function _hasEventListener(eventType) {
        return this[LISTENERS_FIELD].has(eventType);
      }
    
      function _removeEventListener(eventType, listener) {
        this[LISTENERS_FIELD].remove(eventType, listener);
      }
    
      function _removeAllEventListeners(eventType) {
        this[LISTENERS_FIELD].removeAll(eventType);
      }
    
      function _dispatchEvent(event, data) {
        var eventObject = EventDispatcher.getEvent(event, data);
        if (this[PREPROCESSOR_FIELD]) {
          eventObject = this[PREPROCESSOR_FIELD].call(this, eventObject);
        }
        this[LISTENERS_FIELD].call(eventObject);
      }
    
      EventDispatcher.prototype.addEventListener = _addEventListener;
      EventDispatcher.prototype.hasEventListener = _hasEventListener;
      EventDispatcher.prototype.removeEventListener = _removeEventListener;
      EventDispatcher.prototype.removeAllEventListeners = _removeAllEventListeners;
      EventDispatcher.prototype.dispatchEvent = _dispatchEvent;
    
      function EventDispatcher_isObject(value) {
        return (typeof value === 'object') && (value !== null);
      }
    
      function EventDispatcher_getEvent(eventOrType, optionalData) {
        var event = eventOrType;
        if (!EventDispatcher.isObject(eventOrType)) {
          event = new EventDispatcher.Event(String(eventOrType), optionalData);
        }
        return event;
      }
    
      function EventDispatcher_create(eventPreprocessor) {
        return new EventDispatcher(eventPreprocessor);
      }
    
      function EventDispatcher_createNoInitPrototype() {
        return new EventDispatcher(EVENTDISPATCHER_NOINIT);
      }
    
      /*
       function setupOptional(target, name, value) {
       var cleaner = null;
       if (name in target) {
       cleaner = function() {
       };
       } else {
       target[name] = value;
       cleaner = function() {
       delete target[name];
       };
       }
       return cleaner;
       }
       EventDispatcher.setupOptional = setupOptional;
       */
    
      EventDispatcher.isObject = EventDispatcher_isObject;
    
      EventDispatcher.getEvent = EventDispatcher_getEvent;
      EventDispatcher.create = EventDispatcher_create;
      EventDispatcher.createNoInitPrototype = EventDispatcher_createNoInitPrototype;
      EventDispatcher.Event = Event;
      return EventDispatcher;
    })();
    
    return EventDispatcher;
  })();
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
