'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var eventDispatcher = require('@actualwave/event-dispatcher');
var hasOwn = require('@actualwave/has-own');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var hasOwn__default = /*#__PURE__*/_interopDefaultLegacy(hasOwn);

class MessagePortTarget {
  constructor(sender, receiver) {
    this.sender = sender || [];
    this.receiver = receiver || [];

    if (!(this.sender instanceof Array)) {
      this.sender = [this.sender];
    }

    if (!(this.receiver instanceof Array)) {
      this.receiver = [this.receiver];
    }
  }
  /*
    @param data
    @param origin
  */


  postMessage(...args) {
    this.sender.forEach(item => item.postMessage(...args));
  }

  addEventListener(type, handler) {
    this.receiver.forEach(item => item.addEventListener(type, handler));
  }

  removeEventListener(type, handler) {
    this.receiver.forEach(item => item.removeEventListener(type, handler));
  }

}

/**
 * Created by Oleg Galaburda on 09.02.16.
 */
const createId = () => `MP/${Math.ceil(Math.random() * 10000)}/${Date.now()}`;
/**
 * If toJSON method implemented on object, it will be called instead of converting to JSON string.
 * This was made to utilize structured cloning algorithm for raw objects.
 * https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm
 * In this case developer is responsible for converting linked objects.
 * @param object
 * @returns {Object}
 */

const toRawData = object => {
  if (typeof object.toJSON === 'function') {
    return object.toJSON();
  }

  return JSON.stringify(object);
};
/**
 *
 * @param data {Object|String}
 * @returns {Object}
 */

const parseRawData = data => {
  let object; // keep it undefined in case of error

  if (eventDispatcher.isObject(data)) {
    return data;
  }

  try {
    return JSON.parse(data);
  } catch (error) {// this isn't an event we are waiting for.
  }

  return object;
};

/**
 * Created by Oleg Galaburda on 09.02.16.
 */
class MessagePortEvent {
  constructor(event, dispatcherId) {
    this.event = event;
    this.dispatcherId = dispatcherId;
  }

  toJSON() {
    return {
      event: toRawData(this.event),
      dispatcherId: this.dispatcherId
    };
  }

}
const isMessagePortEvent = object => eventDispatcher.isObject(object) && hasOwn__default['default'](object, 'dispatcherId') && hasOwn__default['default'](object, 'event');
const parseMessagePortEvent = object => {
  const result = parseRawData(object);

  if (result && isMessagePortEvent(result)) {
    const {
      event,
      dispatcherId
    } = result;
    return new MessagePortEvent(parseRawData(event), dispatcherId);
  }

  return null;
};

/**
 * Created by Oleg Galaburda on 09.02.16.
 */
class MessagePortDispatcher {
  constructor(target = null, customPostMessageHandler = null, receiverEventPreprocessor = null, senderEventPreprocessor = null) {
    this.dispatcherId = createId();
    this.targetOrigin = '*';
    this.target = target || self;
    this.customPostMessageHandler = customPostMessageHandler;
    this.senderEventPreprocessor = senderEventPreprocessor;
    this.sender = eventDispatcher.createEventDispatcher();
    this.receiver = eventDispatcher.createEventDispatcher(receiverEventPreprocessor);
    this.target.addEventListener('message', event => this._postMessageListener(event));
  }

  addEventListener(eventType, listener, priority) {
    this.receiver.addEventListener(eventType, listener, priority);
  }

  hasEventListener(eventType) {
    return this.receiver.hasEventListener(eventType);
  }

  removeEventListener(eventType, listener) {
    this.receiver.removeEventListener(eventType, listener);
  }

  removeAllEventListeners(eventType) {
    this.receiver.removeAllEventListeners(eventType);
  }

  dispatchEvent(eventType, data, transferList) {
    let event = eventDispatcher.getEvent(eventType, data);

    if (this.senderEventPreprocessor) {
      event = this.senderEventPreprocessor.call(this, event);
    }

    const eventJson = toRawData(new MessagePortEvent(event, this.dispatcherId));
    return this._postMessageHandler(eventJson, transferList);
  }
  /**
   * @private
   */


  _postMessageHandler(data, transferList) {
    const handler = this.customPostMessageHandler;

    if (handler) {
      return handler.call(this, data, this.targetOrigin, transferList);
    }

    return this.target.postMessage(data, this.targetOrigin, transferList);
  }
  /**
   * @private
   */


  _postMessageListener(event) {
    // INFO .nativeEvent react-native thing, it contains event object coming from WebView
    event = event.nativeEvent || event;
    const message = parseMessagePortEvent(event.data);

    if (message) {
      if (message.dispatcherId === this.dispatcherId) {
        this.sender.dispatchEvent(message.event);
      } else {
        this.receiver.dispatchEvent(message.event);
      }
    }
  }

}
const createMessagePortDispatcher = (target, customPostMessageHandler, receiverEventPreprocessor, senderEventPreprocessor) => new MessagePortDispatcher(target, customPostMessageHandler, receiverEventPreprocessor, senderEventPreprocessor);

const factory = (getTarget, dispatcher = null) => () => {
  if (!dispatcher) {
    dispatcher = createMessagePortDispatcher(getTarget());
  }

  return dispatcher;
};

const getForSelf = factory(() => self);
const getForParent = factory(() => parent);
const getForTop = factory(() => top);

exports.MessagePortDispatcher = MessagePortDispatcher;
exports.MessagePortEvent = MessagePortEvent;
exports.MessagePortTarget = MessagePortTarget;
exports.createMessagePortDispatcher = createMessagePortDispatcher;
exports.default = MessagePortDispatcher;
exports.getForParent = getForParent;
exports.getForSelf = getForSelf;
exports.getForTop = getForTop;
exports.isMessagePortEvent = isMessagePortEvent;
exports.parseMessagePortEvent = parseMessagePortEvent;
//# sourceMappingURL=index.js.map
