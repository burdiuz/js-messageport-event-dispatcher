'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var hasOwn = _interopDefault(require('@actualwave/has-own'));

function unwrapExports (x) {
	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
}

function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

var eventDispatcher = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var hasOwn$$1 = _interopDefault(hasOwn);

/**
 * Created by Oleg Galaburda on 09.02.16.
 *      
 */

class Event {

  constructor(type, data = null) {
    this.type = type;
    this.data = data;
    this.defaultPrevented = false;
  }

  toJSON() {
    return { type: this.type, data: this.data };
  }

  isDefaultPrevented() {
    return this.defaultPrevented;
  }

  preventDefault() {
    this.defaultPrevented = true;
  }
}

class ListenersRunner {

  constructor(listeners, onStopped, onComplete) {
    this.index = -1;
    this.immediatelyStopped = false;

    this.stopImmediatePropagation = () => {
      this.immediatelyStopped = true;
    };

    this.listeners = listeners;
    this.onStopped = onStopped;
    this.onComplete = onComplete;
  }

  run(event, target) {
    let listener;
    const { listeners } = this;
    this.augmentEvent(event);
    // TODO this has to be handled in separate object ListenersRunner that should be
    // created for each call() call and asked for index validation on each listener remove.
    for (this.index = 0; this.index < listeners.length; this.index++) {
      if (this.immediatelyStopped) break;
      listener = listeners[this.index];
      listener.call(target, event);
    }
    this.clearEvent(event);
    this.onComplete(this);
  }

  augmentEvent(eventObject) {
    const event = eventObject;
    event.stopPropagation = this.onStopped;
    event.stopImmediatePropagation = this.stopImmediatePropagation;
  }

  /* eslint class-methods-use-this: "off" */
  clearEvent(eventObject) {
    const event = eventObject;
    delete event.stopPropagation;
    delete event.stopImmediatePropagation;
  }

  listenerRemoved(listeners, index) {
    if (listeners === this.listeners && index <= this.index) {
      this.index--;
    }
  }
}

class EventListeners {
  constructor() {
    this._listeners = {};
    this._runners = [];

    this.removeRunner = runner => {
      this._runners.splice(this._runners.indexOf(runner), 1);
    };
  }
  /**
   * key - event Type
   * value - hash of priorities
   *    key - priority
   *    value - list of handlers
   * @type {Object<string, Object.<string, Array<number, Function>>>}
   * @private
   */


  createList(eventType, priorityOpt) {
    const priority = parseInt(priorityOpt, 10);
    const target = this.getPrioritiesByKey(eventType);
    const key = String(priority);
    let value;
    if (hasOwn$$1(target, key)) {
      value = target[key];
    } else {
      value = [];
      target[key] = value;
    }
    return value;
  }

  getPrioritiesByKey(key) {
    let value;
    if (hasOwn$$1(this._listeners, key)) {
      value = this._listeners[key];
    } else {
      value = {};
      this._listeners[key] = value;
    }
    return value;
  }

  add(eventType, handler, priority) {
    const handlers = this.createList(eventType, priority);
    if (handlers.indexOf(handler) < 0) {
      handlers.push(handler);
    }
  }

  has(eventType) {
    let priority;
    let result = false;
    const priorities = this.getPrioritiesByKey(eventType);
    if (priorities) {
      for (priority in priorities) {
        if (hasOwn$$1(priorities, priority)) {
          result = true;
          break;
        }
      }
    }
    return result;
  }

  remove(eventType, handler) {
    const priorities = this.getPrioritiesByKey(eventType);
    if (priorities) {
      const list = Object.getOwnPropertyNames(priorities);
      const { length } = list;
      for (let index = 0; index < length; index++) {
        const priority = list[index];
        const handlers = priorities[priority];
        const handlerIndex = handlers.indexOf(handler);
        if (handlerIndex >= 0) {
          handlers.splice(handlerIndex, 1);
          if (!handlers.length) {
            delete priorities[priority];
          }
          this._runners.forEach(runner => {
            runner.listenerRemoved(handlers, handlerIndex);
          });
        }
      }
    }
  }

  removeAll(eventType) {
    delete this._listeners[eventType];
  }

  createRunner(handlers, onStopped) {
    const runner = new ListenersRunner(handlers, onStopped, this.removeRunner);
    this._runners.push(runner);
    return runner;
  }

  call(event, target) {
    const priorities = this.getPrioritiesByKey(event.type);
    let stopped = false;
    const stopPropagation = () => {
      stopped = true;
    };
    if (priorities) {
      // getOwnPropertyNames() or keys()?
      const list = Object.getOwnPropertyNames(priorities).sort((a, b) => a - b);
      const { length } = list;
      for (let index = 0; index < length; index++) {
        if (stopped) break;
        const handlers = priorities[list[index]];
        // in case if all handlers of priority were removed while event
        // was dispatched and handlers become undefined.
        if (handlers) {
          const runner = this.createRunner(handlers, stopPropagation);
          runner.run(event, target);
          if (runner.immediatelyStopped) break;
        }
      }
    }
  }
}

class EventDispatcher {

  constructor(eventPreprocessor = null, noInit = false) {
    if (!noInit) {
      this.initialize(eventPreprocessor);
    }
  }

  /**
   * @private
   */
  initialize(eventPreprocessor = null) {
    this._eventPreprocessor = eventPreprocessor;
    this._listeners = new EventListeners();
  }

  addEventListener(eventType, listener, priority = 0) {
    this._listeners.add(eventType, listener, -priority || 0);
  }

  hasEventListener(eventType) {
    return this._listeners.has(eventType);
  }

  removeEventListener(eventType, listener) {
    this._listeners.remove(eventType, listener);
  }

  removeAllEventListeners(eventType) {
    this._listeners.removeAll(eventType);
  }

  dispatchEvent(event, data) {
    let eventObject = EventDispatcher.getEvent(event, data);
    if (this._eventPreprocessor) {
      eventObject = this._eventPreprocessor.call(this, eventObject);
    }
    this._listeners.call(eventObject);
  }

  static isObject(value) {
    return typeof value === 'object' && value !== null;
  }

  static getEvent(eventOrType, optionalData) {
    let event = eventOrType;
    if (!EventDispatcher.isObject(eventOrType)) {
      event = new EventDispatcher.Event(String(eventOrType), optionalData);
    }
    return event;
  }

  static create(eventPreprocessor) {
    return new EventDispatcher(eventPreprocessor);
  }

  /* eslint no-undef: "off" */

}

EventDispatcher.Event = Event;

exports.default = EventDispatcher;
exports.Event = Event;
exports.EventDispatcher = EventDispatcher;

});

var EventDispatcher = unwrapExports(eventDispatcher);
var eventDispatcher_1 = eventDispatcher.Event;
var eventDispatcher_2 = eventDispatcher.EventDispatcher;

/**
 * Created by Oleg Galaburda on 09.02.16.
 *      
 */

class MessagePortEvent {

  constructor(event, dispatcherId) {
    this.event = event;
    this.dispatcherId = dispatcherId;
  }

  toJSON() {
    return {
      /* eslint no-use-before-define:0 */
      event: MessagePortDispatcher.toJSON(this.event),
      dispatcherId: this.dispatcherId
    };
  }

  static parse(object) {
    /* eslint no-use-before-define:0 */
    let result = MessagePortDispatcher.parse(object);
    if (MessagePortEvent.isEvent(result)) {
      /* eslint no-use-before-define:0 */
      result.event = MessagePortDispatcher.parse(result.event);
    } else {
      result = null;
    }
    return result;
  }

  static isEvent(object) {
    return EventDispatcher.isObject(object) && hasOwn(object, 'dispatcherId') && hasOwn(object, 'event');
  }
}

class MessagePortDispatcher extends EventDispatcher {

  /**
   *
   * @param target {Window|Worker|MessagePort}
   * @param customPostMessageHandler {?Function} Function that receive message object
   *        and pass it to MessagePort.postMessage()
   * @param receiverEventPreprocessor {?Function} Function that pre-process
   *        all events received from MessagePort, before passing to listeners
   * @param senderEventPreprocessor Function that pre-process all events sent
   *        to MessagePort
   * @constructor
   */
  constructor(target, customPostMessageHandler = null, receiverEventPreprocessor = null, senderEventPreprocessor = null, noInit = false) {
    super(null, true);
    if (!noInit) {
      this.initialize(target, customPostMessageHandler, receiverEventPreprocessor, senderEventPreprocessor);
    }
  }

  /**
   * @private
   */
  initialize(target, customPostMessageHandler, receiverEventPreprocessor, senderEventPreprocessor) {
    this.target = target || self;
    this._handlers = {
      customPostMessageHandler,
      senderEventPreprocessor
    };
    this.sender = EventDispatcher.create();
    this.receiver = EventDispatcher.create(receiverEventPreprocessor);
    this.dispatcherId = `MP/${Math.ceil(Math.random() * 10000)}/${Date.now()}`;
    this.targetOrigin = '*';
    this.addEventListener = this.receiver.addEventListener.bind(this.receiver);
    this.hasEventListener = this.receiver.hasEventListener.bind(this.receiver);
    this.removeEventListener = this.receiver.removeEventListener.bind(this.receiver);
    this.removeAllEventListeners = this.receiver.removeAllEventListeners.bind(this.receiver);

    target.addEventListener('message', this._messageEventListener.bind(this));
  }

  dispatchEvent(eventType, data, transferList) {
    let event = EventDispatcher.getEvent(eventType, data);
    if (this._handlers.senderEventPreprocessor) {
      event = this._handlers.senderEventPreprocessor.call(this, event);
    }
    const eventJson = MessagePortDispatcher.toJSON(new MessagePortEvent(event, this.dispatcherId));
    this._postMessageHandler(eventJson, transferList);
  }

  _postMessageHandler(data, transferList) {
    const handler = this._handlers.customPostMessageHandler;
    if (handler) {
      handler.call(this, data, this.targetOrigin, transferList);
    } else {
      this.target.postMessage(data, this.targetOrigin, transferList);
    }
  }

  _messageEventListener(event) {
    // fixme .nativeEvent react-native thing, need a way to find out keep it or exclude
    event = event.nativeEvent || event;
    const message = MessagePortEvent.parse(event.data);
    if (message) {
      if (message.dispatcherId === this.dispatcherId) {
        this.sender.dispatchEvent(message.event);
      } else {
        this.receiver.dispatchEvent(message.event);
      }
    }
  }

  /**
   * If toJSON method implemented on object, it will be called instead of converting to JSON string.
   * This was made to utilize structured cloning algorithm for raw objects.
   * https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm
   * In this case developer is responsible for converting linked objects.
   * @param object
   * @returns {Object|String}
   */
  static toJSON(object) {
    let objectJson;
    if (typeof object.toJSON === 'function') {
      objectJson = object.toJSON();
    } else {
      objectJson = JSON.stringify(object);
    }
    return objectJson;
  }

  /**
   *
   * @param data {Object|String}
   * @returns {Object}
   */
  static parse(data) {
    let object; // keep it undefined in case of error
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

  static create(target, customPostMessageHandler, receiverEventPreprocessor, senderEventPreprocessor) {
    return new MessagePortDispatcher(target, customPostMessageHandler, receiverEventPreprocessor, senderEventPreprocessor);
  }

}

const factory = (getTarget, dispatcher = null) => () => {
  if (!dispatcher) {
    dispatcher = MessagePortDispatcher.create(getTarget());
  }
  return dispatcher;
};

MessagePortDispatcher.self = factory(() => self);
MessagePortDispatcher.parent = factory(() => parent);
MessagePortDispatcher.top = factory(() => top);
MessagePortDispatcher.MessagePortEvent = MessagePortEvent;

const { self: self$1, create } = MessagePortDispatcher;

exports.default = MessagePortDispatcher;
exports.MessagePortEvent = MessagePortEvent;
exports.self = self$1;
exports.create = create;
//# sourceMappingURL=messageport-dispatcher.js.map
