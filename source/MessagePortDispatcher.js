/**
 * Created by Oleg Galaburda on 09.02.16.
 */
import EventDispatcher from '@actualwave/event-dispatcher';
import { MessagePortEvent, parseMessagePortEvent } from './MessagePortEvent';
import { createId, toRawData } from './utils';

export const create = (
  target,
  customPostMessageHandler,
  receiverEventPreprocessor,
  senderEventPreprocessor,
) =>
  new MessagePortDispatcher(
    target,
    customPostMessageHandler,
    receiverEventPreprocessor,
    senderEventPreprocessor,
  );

export const factory = (getTarget, dispatcher = null) => () => {
  if (!dispatcher) {
    return create(getTarget());
  }
  return dispatcher;
};

// eslint-disable-next-line no-restricted-globals
export const createForSelf = factory(() => self);

// eslint-disable-next-line no-restricted-globals
export const createForParent = factory(() => parent);

// eslint-disable-next-line no-restricted-globals
export const createForTop = factory(() => top);

export class MessagePortDispatcher extends EventDispatcher {
  customPostMessageHandler;
  senderEventPreprocessor;
  sender;
  receiver;
  dispatcherId;
  targetOrigin;

  constructor(
    target,
    customPostMessageHandler = null,
    receiverEventPreprocessor = null,
    senderEventPreprocessor = null,
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
    customPostMessageHandler = null,
    receiverEventPreprocessor = null,
    senderEventPreprocessor = null,
  ) {
    // eslint-disable-next-line no-restricted-globals
    this.target = target || self;
    this.customPostMessageHandler = customPostMessageHandler;
    this.senderEventPreprocessor = senderEventPreprocessor;
    this.sender = EventDispatcher.create();
    this.receiver = EventDispatcher.create(receiverEventPreprocessor);
    this.dispatcherId = createId();
    this.targetOrigin = '*';

    target.addEventListener('message', this._messageEventListener);
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
    let event = EventDispatcher.getEvent(eventType, data);
    if (this.senderEventPreprocessor) {
      event = this.senderEventPreprocessor.call(this, event);
    }
    const eventJson = toRawData(new MessagePortEvent(event, this.dispatcherId));
    this._postMessageHandler(eventJson, transferList);
  }

  _postMessageHandler = (data, transferList) => {
    const handler = this.customPostMessageHandler;
    if (handler) {
      handler.call(this, data, this.targetOrigin, transferList);
    } else {
      this.target.postMessage(data, this.targetOrigin, transferList);
    }
  };

  _messageEventListener = (event) => {
    // fixme .nativeEvent react-native thing, need a way to find out keep it or exclude
    event = event.nativeEvent || event;
    const message = parseMessagePortEvent(event.data);

    if (message) {
      if (message.dispatcherId === this.dispatcherId) {
        this.sender.dispatchEvent(message.event);
      } else {
        this.receiver.dispatchEvent(message.event);
      }
    }
  };

  static create = create;

  // eslint-disable-next-line no-restricted-globals
  static self = createForSelf;

  // eslint-disable-next-line no-restricted-globals
  static parent = createForParent;

  // eslint-disable-next-line no-restricted-globals
  static top = createForTop;
}

MessagePortDispatcher.MessagePortEvent = MessagePortEvent;

export default MessagePortDispatcher;
