/**
 * Created by Oleg Galaburda on 09.02.16.
 */

import SymbolImpl from './SymbolImpl';
import EventDispatcher from './EventDispatcher';

class MessagePortEvent {
  constructor(event, dispatcherId) {
    this.event = event;
    this.dispatcherId = dispatcherId;
  }

  toJSON() {
    return {
      event: MessagePortDispatcher.toJSON(this.event),
      dispatcherId: this.dispatcherId
    };
  }

  static parse(object) {
    var result = MessagePortDispatcher.parse(object);
    if (MessagePortEvent.isEvent(result)) {
      result.event = MessagePortDispatcher.parse(result.event);
    } else {
      result = null;
    }
    return result;
  }

  static isEvent(object) {
    return EventDispatcher.isObject(object) && object.hasOwnProperty('dispatcherId') && object.hasOwnProperty('event');
  }
}

const factory = (getTarget, dispatcher = null) => () => {
  if (!dispatcher) {
    dispatcher = MessagePortDispatcher.create(getTarget());
  }
  return dispatcher;
};

const HANDLERS_FIELD = SymbolImpl('message.port.dispatcher::handlers');

export class MessagePortDispatcher extends EventDispatcher {

  /**
   *
   * @param target {Window|Worker|MessagePort}
   * @param customPostMessageHandler {?Function} Function that receive message object and pass it to MessagePort.postMessage()
   * @param receiverEventPreprocessor {?Function} Function that pre-process all events received from MessagePort, before passing to listeners
   * @param senderEventPreprocessor Function that pre-process all events sent to MessagePort
   * @constructor
   */
  constructor(target, customPostMessageHandler, receiverEventPreprocessor, senderEventPreprocessor, noInit = false) {
    super(null, true);
    if (!noInit) {
      this.initiallize(target, customPostMessageHandler, receiverEventPreprocessor, senderEventPreprocessor);
    }
  }

  /**
   * @private
   */
  initiallize(target, customPostMessageHandler, receiverEventPreprocessor, senderEventPreprocessor) {
    this.target = target || self;
    this[HANDLERS_FIELD] = {
      customPostMessageHandler: customPostMessageHandler,
      senderEventPreprocessor: senderEventPreprocessor
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

  dispatchEvent(event, data, transferList) {
    event = EventDispatcher.getEvent(event, data);
    if (this[HANDLERS_FIELD].senderEventPreprocessor) {
      event = this[HANDLERS_FIELD].senderEventPreprocessor.call(this, event);
    }
    var eventJson = MessagePortDispatcher.toJSON(new MessagePortEvent(event, this.dispatcherId));
    this._postMessageHandler(eventJson, transferList);
  }

  _postMessageHandler(data, transferList) {
    const handler = this[HANDLERS_FIELD].customPostMessageHandler;
    if (handler) {
      handler.call(this, data, transferList);
    } else {
      this.target.postMessage(data, this.targetOrigin, transferList);
    }
  }

  _messageEventListener(event) {
    event = event.nativeEvent || event;
    var message = MessagePortEvent.parse(event.data);
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
    if (typeof(object.toJSON) === 'function') {
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

  /**
   * @returns {MessagePortDispatcher}
   */
  static self = factory(() => self);

  /**
   * @returns {MessagePortDispatcher}
   */
  static parent = factory(() => parent);

  /**
   * @returns {MessagePortDispatcher}
   */
  static top = factory(() => top);

  static create(target, customPostMessageHandler, receiverEventPreprocessor, senderEventPreprocessor) {
    return new MessagePortDispatcher(target, customPostMessageHandler, receiverEventPreprocessor, senderEventPreprocessor);
  }
}

export default MessagePortDispatcher;
