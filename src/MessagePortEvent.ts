import { toRawData, parseRawData } from './utils';

export class MessagePortEvent {
  event: unknown;
  dispatcherId: string;

  constructor(event: unknown, dispatcherId: string) {
    this.event = event;
    this.dispatcherId = dispatcherId;
  }

  toJSON(): { event: unknown; dispatcherId: string } {
    return {
      event: toRawData(this.event),
      dispatcherId: this.dispatcherId,
    };
  }
}

export const isMessagePortEvent = (
  object: unknown,
): object is { event: unknown; dispatcherId: string } =>
  typeof object === 'object' &&
  object !== null &&
  Object.hasOwn(object, 'dispatcherId') &&
  Object.hasOwn(object, 'event');

export const parseMessagePortEvent = (object: unknown): MessagePortEvent | null => {
  const result = parseRawData(object);
  if (result && isMessagePortEvent(result)) {
    const { event, dispatcherId } = result;
    return new MessagePortEvent(parseRawData(event), dispatcherId);
  }
  return null;
};
