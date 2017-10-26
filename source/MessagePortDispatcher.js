/**
 * Created by Oleg Galaburda on 09.02.16.
 * @flow
 */

import EventDispatcher from 'event-dispatcher';

import type {
  EventObject,
  EventListener,
  EventProcessor,
  PostMessage,
  IMessagePortEvent,
  MessagePortTarget,
} from './TypeDefinition';

export class MessagePortEvent implements IMessagePortEvent {
  event: EventObject;
  dispatcherId: string;

  constructor(event: EventObject, dispatcherId: string) {
    this.event = event;
    this.dispatcherId = dispatcherId;
  }

  toJSON(): IMessagePortEvent {
    return {
      /* eslint no-use-before-define:0 */
      event: MessagePortDispatcher.toJSON(this.event),
      dispatcherId: this.dispatcherId,
    };
  }

  static parse(object: mixed): string {
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
    return EventDispatcher.isObject(object) &&
      Object.prototype.hasOwnProperty.call(object, 'dispatcherId') &&
      Object.prototype.hasOwnProperty.call(object, 'event');
  }
}

type StaticGlobalDispatcher = () => MessagePortDispatcher;
type MPDispatcherInternals = {
  customPostMessageHandler?: PostMessage,
  senderEventPreprocessor?: EventProcessor
};

export class MessagePortDispatcher extends EventDispatcher {
  _handlers: MPDispatcherInternals;
  sender: EventDispatcher;
  receiver: EventDispatcher;
  dispatcherId: string;
  targetOrigin: string;
  addEventListener: (type: string, handler: EventListener) => void;
  hasEventListener: (eventType: string) => boolean;
  removeEventListener: (eventType: string) => void;
  removeAllEventListeners: (eventType: string) => void;

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
  constructor(
    target: MessagePortTarget,
    customPostMessageHandler?: PostMessage = null,
    receiverEventPreprocessor?: EventProcessor = null,
    senderEventPreprocessor: EventProcessor = null,
    noInit = false,
  ) {
    super(null, true);
    if (!noInit) {
      this.initialize(
        target,
        customPostMessageHandler,
        receiverEventPreprocessor,
        senderEventPreprocessor,
      );
    }
  }

  /**
   * @private
   */
  initialize(
    target,
    customPostMessageHandler,
    receiverEventPreprocessor,
    senderEventPreprocessor,
  ) {
    this.target = target || self;
    this._handlers = {
      customPostMessageHandler,
      senderEventPreprocessor,
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
    if (typeof (object.toJSON) === 'function') {
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

  static create(
    target,
    customPostMessageHandler,
    receiverEventPreprocessor,
    senderEventPreprocessor,
  ) {
    return new MessagePortDispatcher(
      target,
      customPostMessageHandler,
      receiverEventPreprocessor,
      senderEventPreprocessor,
    );
  }

  static self: StaticGlobalDispatcher;
  static parent: StaticGlobalDispatcher;
  static top: StaticGlobalDispatcher;
}

const factory = (
  getTarget: () => MessagePortTarget,
  dispatcher: MessagePortDispatcher = null,
): StaticGlobalDispatcher => (): MessagePortDispatcher => {
  if (!dispatcher) {
    dispatcher = MessagePortDispatcher.create(getTarget());
  }
  return dispatcher;
};

MessagePortDispatcher.self = factory(() => self);
MessagePortDispatcher.parent = factory(() => parent);
MessagePortDispatcher.top = factory(() => top);
MessagePortDispatcher.MessagePortEvent = MessagePortEvent;

export default MessagePortDispatcher;
