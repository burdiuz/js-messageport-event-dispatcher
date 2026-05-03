/* eslint-disable @typescript-eslint/no-explicit-any */

interface PostMessageTarget {
  postMessage(...args: any[]): void;
}

interface EventListenerTarget {
  addEventListener(type: string, handler: (event: any) => void): void;
  removeEventListener(type: string, handler: (event: any) => void): void;
}

export class MessagePortTarget {
  sender: PostMessageTarget[];
  receiver: EventListenerTarget[];

  constructor(
    sender?: PostMessageTarget | PostMessageTarget[] | null,
    receiver?: EventListenerTarget | EventListenerTarget[] | null,
  ) {
    this.sender = sender ? (Array.isArray(sender) ? sender : [sender]) : [];
    this.receiver = receiver ? (Array.isArray(receiver) ? receiver : [receiver]) : [];
  }

  postMessage(...args: any[]): void {
    this.sender.forEach((item) => item.postMessage(...args));
  }

  addEventListener(type: string, handler: (event: any) => void): void {
    this.receiver.forEach((item) => item.addEventListener(type, handler));
  }

  removeEventListener(type: string, handler: (event: any) => void): void {
    this.receiver.forEach((item) => item.removeEventListener(type, handler));
  }
}

export default MessagePortTarget;
