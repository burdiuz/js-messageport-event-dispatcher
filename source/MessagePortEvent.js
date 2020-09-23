/**
 * Created by Oleg Galaburda on 09.02.16.
 */
import hasOwn from '@actualwave/has-own';
import { isObject } from '@actualwave/event-dispatcher';
import { toRawData, parseRawData } from './utils';

export class MessagePortEvent {
  constructor(event, dispatcherId) {
    this.event = event;
    this.dispatcherId = dispatcherId;
  }

  toJSON() {
    return {
      event: toRawData(this.event),
      dispatcherId: this.dispatcherId,
    };
  }
}

export const isMessagePortEvent = (object) =>
  isObject(object) && hasOwn(object, 'dispatcherId') && hasOwn(object, 'event');

export const parseMessagePortEvent = (object) => {
  const result = parseRawData(object);

  if (result && isMessagePortEvent(result)) {
    const { event, dispatcherId } = result;
    return new MessagePortEvent(parseRawData(event), dispatcherId);
  }

  return null;
};
