import { MessagePortTarget } from './MessagePortTarget';
import {
  MessagePortDispatcher,
  getForSelf,
  getForParent,
  getForTop,
  createMessagePortDispatcher,
} from './MessagePortDispatcher';
import { MessagePortEvent, isMessagePortEvent, parseMessagePortEvent } from './MessagePortEvent';

export default MessagePortDispatcher;
export {
  MessagePortTarget,
  MessagePortDispatcher,
  MessagePortEvent,
  isMessagePortEvent,
  parseMessagePortEvent,
  getForSelf,
  getForParent,
  getForTop,
  createMessagePortDispatcher,
};
