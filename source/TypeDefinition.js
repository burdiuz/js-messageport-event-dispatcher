/**
 * @flow
 */

export type EventObject = {
  type: string;
  data?: mixed;
  stopPropagation?: ?Function;
  stopImmediatePropagation?: ?Function;
};

export type EventType = string | EventObject;

export type EventListener = (event?: EventObject) => void;

export interface IMessagePortEvent {
  event: EventObject;
  dispatcherId: string;
}

export type PostMessage = (data: any, targetOrigin?: string, transferList?: any[])=> void;

export type EventProcessor = (event: EventObject) => EventObject;

export type MessagePortTarget = {
  addEventListener: (type: string, handler: EventListener) => void;
  postMessage: PostMessage;
};
