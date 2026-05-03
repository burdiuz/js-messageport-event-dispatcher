/* eslint-disable no-restricted-globals, @typescript-eslint/no-explicit-any */

import {
  createEventDispatcher,
  type IEventDispatcher,
  type EventType,
  type EventListener,
  type EventProcessor,
  type EventObject,
} from '@actualwave/event-dispatcher';
import { MessagePortEvent, parseMessagePortEvent } from './MessagePortEvent';
import { createId, toRawData } from './utils';

export interface MessagePortLike {
  postMessage(data: unknown, targetOrigin: string, transferList?: Transferable[]): void;
  addEventListener(type: string, handler: (event: any) => void): void;
}

type PostMessageHandler = (
  this: MessagePortDispatcher,
  data: unknown,
  targetOrigin: string,
  transferList?: Transferable[],
) => void;

export class MessagePortDispatcher {
  dispatcherId: string = createId();
  targetOrigin: string = '*';
  target: MessagePortLike;
  customPostMessageHandler: PostMessageHandler | null;
  senderEventPreprocessor: EventProcessor | null;
  sender: IEventDispatcher;
  receiver: IEventDispatcher;

  constructor(
    target: MessagePortLike | null = null,
    customPostMessageHandler: PostMessageHandler | null = null,
    receiverEventPreprocessor: EventProcessor | null = null,
    senderEventPreprocessor: EventProcessor | null = null,
  ) {
    this.target = target ?? (self as unknown as MessagePortLike);
    this.customPostMessageHandler = customPostMessageHandler;
    this.senderEventPreprocessor = senderEventPreprocessor;
    this.sender = createEventDispatcher();
    this.receiver = createEventDispatcher(receiverEventPreprocessor ?? undefined);

    this.target.addEventListener('message', (event) => this._postMessageListener(event));
  }

  addEventListener(eventType: string, listener: EventListener, priority?: number): void {
    this.receiver.addEventListener(eventType, listener, priority);
  }

  hasEventListener(eventType: string): boolean {
    return this.receiver.hasEventListener(eventType);
  }

  removeEventListener(eventType: string, listener: EventListener): void {
    this.receiver.removeEventListener(eventType, listener);
  }

  removeAllEventListeners(eventType: string): void {
    this.receiver.removeAllEventListeners(eventType);
  }

  dispatchEvent(eventType: EventType, data?: unknown, transferList?: Transferable[]): void {
    let event: EventObject =
      typeof eventType === 'string' ? { type: eventType, data } : eventType;

    if (this.senderEventPreprocessor) {
      event = this.senderEventPreprocessor(event);
    }

    const eventJson = toRawData(new MessagePortEvent(event, this.dispatcherId));
    this._postMessageHandler(eventJson, transferList);
  }

  private _postMessageHandler(data: unknown, transferList?: Transferable[]): void {
    const handler = this.customPostMessageHandler;
    if (handler) {
      handler.call(this, data, this.targetOrigin, transferList);
      return;
    }
    this.target.postMessage(data, this.targetOrigin, transferList);
  }

  private _postMessageListener(event: any): void {
    // .nativeEvent is a React Native property containing the event from WebView
    const nativeEvent = event.nativeEvent ?? event;
    const message = parseMessagePortEvent(nativeEvent.data);

    if (message) {
      if (message.dispatcherId === this.dispatcherId) {
        this.sender.dispatchEvent(message.event as EventObject);
      } else {
        this.receiver.dispatchEvent(message.event as EventObject);
      }
    }
  }
}

export const createMessagePortDispatcher = (
  target?: MessagePortLike | null,
  customPostMessageHandler?: PostMessageHandler | null,
  receiverEventPreprocessor?: EventProcessor | null,
  senderEventPreprocessor?: EventProcessor | null,
): MessagePortDispatcher =>
  new MessagePortDispatcher(
    target ?? null,
    customPostMessageHandler ?? null,
    receiverEventPreprocessor ?? null,
    senderEventPreprocessor ?? null,
  );

const factory = (getTarget: () => MessagePortLike) => {
  let dispatcher: MessagePortDispatcher | null = null;
  return (): MessagePortDispatcher => {
    if (!dispatcher) {
      dispatcher = createMessagePortDispatcher(getTarget());
    }
    return dispatcher;
  };
};

export const getForSelf = factory(() => self as unknown as MessagePortLike);
export const getForParent = factory(() => parent as unknown as MessagePortLike);
export const getForTop = factory(() => top as unknown as MessagePortLike);
