import MessagePortDispatcher, { MessagePortEvent } from './MessagePortDispatcher';

const { self, create } = MessagePortDispatcher;

export default MessagePortDispatcher;
export { MessagePortEvent, self, create };
