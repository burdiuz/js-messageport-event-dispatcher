export class MessagePortTarget {
  constructor(sender, receiver) {
    this.sender = sender || [];
    this.receiver = receiver || [];

    if (!(this.sender instanceof Array)) {
      this.sender = [this.sender];
    }

    if (!(this.receiver instanceof Array)) {
      this.receiver = [this.receiver];
    }
  }

  /*
    @param data
    @param origin
  */
  postMessage(...args) {
    this.sender.forEach((item) => item.postMessage(...args));
  }

  addEventListener(type, handler) {
    this.receiver.forEach((item) => item.addEventListener(type, handler));
  }

  removeEventListener(type, handler) {
    this.receiver.forEach((item) => item.removeEventListener(type, handler));
  }
}

export default MessagePortTarget;
