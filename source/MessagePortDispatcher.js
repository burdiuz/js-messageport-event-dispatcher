/**
 * Created by Oleg Galaburda on 09.02.16.
 */
/* eslint-disable no-restricted-globals */

import { createEventDispatcher, getEvent } from '@actualwave/event-dispatcher';
import { MessagePortEvent, parseMessagePortEvent } from './MessagePortEvent';
import { createId, toRawData } from './utils';

export class MessagePortDispatcher {
  dispatcherId = createId();

  targetOrigin = '*';

  constructor(
    target = null,
    customPostMessageHandler = null,
    receiverEventPreprocessor = null,
    senderEventPreprocessor = null,
  ) {
    this.target = target || self;
    this.customPostMessageHandler = customPostMessageHandler;
    this.senderEventPreprocessor = senderEventPreprocessor;
    this.sender = createEventDispatcher();
    this.receiver = createEventDispatcher(receiverEventPreprocessor);

    target.addEventListener('message', (event) => this._postMessageListener(event));
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
    let event = getEvent(eventType, data);

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

export const createMessagePortDispatcher = (
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
    return createMessagePortDispatcher(getTarget());
  }
  return dispatcher;
};

export const createForSelf = factory(() => self);

export const createForParent = factory(() => parent);

export const createForTop = factory(() => top);

export default MessagePortDispatcher;
