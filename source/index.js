import {
  MessagePortDispatcher,
  factory,
  getForSelf,
  getForParent,
  getForTop,
  createMessagePortDispatcher,
} from './MessagePortDispatcher';
import { MessagePortEvent, isMessagePortEvent, parseMessagePortEvent } from './MessagePortEvent';

export default MessagePortDispatcher;
export {
  MessagePortDispatcher,
  MessagePortEvent,
  isMessagePortEvent,
  parseMessagePortEvent,
  factory,
  getForSelf,
  getForParent,
  getForTop,
  createMessagePortDispatcher,
};
