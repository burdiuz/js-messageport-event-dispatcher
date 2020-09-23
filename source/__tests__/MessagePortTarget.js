import { MessagePortTarget } from '../MessagePortTarget';

describe('MessagePortTarget', () => {
  let instance;

  const makeSender = () => ({
    postMessage: jest.fn(),
  });

  const makeReceiver = () => ({
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  });

  const listenerAdd = () => {};
  const listenerRemove = () => {};

  beforeEach(() => {});

  describe('When having receiver and sender', () => {
    let receiver;
    let sender;

    beforeEach(() => {
      sender = makeSender();
      receiver = makeReceiver();
      instance = new MessagePortTarget(sender, receiver);

      instance.postMessage('my data', '*');
      instance.addEventListener('message', listenerAdd);
      instance.removeEventListener('message', listenerRemove);
    });

    it('should post a message to sender', () => {
      expect(sender.postMessage).toHaveBeenCalledTimes(1);
      expect(sender.postMessage).toHaveBeenCalledWith('my data', '*');
    });

    it('should call addEventListener on receiver', () => {
      expect(receiver.addEventListener).toHaveBeenCalledTimes(1);
      expect(receiver.addEventListener).toHaveBeenCalledWith('message', listenerAdd);
    });

    it('should call removeEventListener on receiver', () => {
      expect(receiver.removeEventListener).toHaveBeenCalledTimes(1);
      expect(receiver.removeEventListener).toHaveBeenCalledWith('message', listenerRemove);
    });
  });

  describe('When having receivers only', () => {
    let receiver;

    beforeEach(() => {
      receiver = makeReceiver();
      instance = new MessagePortTarget(null, receiver);

      instance.addEventListener('message', listenerAdd);
      instance.removeEventListener('message', listenerRemove);
    });

    it('should not throw error on posting mesage', () => {
      expect(() => {
        instance.postMessage('my data', '*');
      }).not.toThrow();
    });

    it('should call addEventListener on receiver', () => {
      expect(receiver.addEventListener).toHaveBeenCalledTimes(1);
      expect(receiver.addEventListener).toHaveBeenCalledWith('message', listenerAdd);
    });

    it('should call removeEventListener on receiver', () => {
      expect(receiver.removeEventListener).toHaveBeenCalledTimes(1);
      expect(receiver.removeEventListener).toHaveBeenCalledWith('message', listenerRemove);
    });
  });

  describe('When having senders only', () => {
    let sender;

    beforeEach(() => {
      sender = makeSender();
      instance = new MessagePortTarget(sender);

      instance.postMessage('my data', '*');
    });

    it('should post a message to sender', () => {
      expect(sender.postMessage).toHaveBeenCalledTimes(1);
      expect(sender.postMessage).toHaveBeenCalledWith('my data', '*');
    });

    it('should not throw when adding listeners', () => {
      expect(() => {
        instance.addEventListener('message', listenerAdd);
        instance.removeEventListener('message', listenerRemove);
      }).not.toThrow();
    });
  });

  describe('When having multiple receivers and senders', () => {
    let receiver;
    let sender;

    beforeEach(() => {
      sender = makeSender();
      receiver = makeReceiver();
      instance = new MessagePortTarget([sender, sender, sender], [receiver, receiver, receiver]);

      instance.postMessage('my data', '*');
      instance.addEventListener('message', listenerAdd);
      instance.removeEventListener('message', listenerRemove);
    });

    it('should post a message to sender', () => {
      expect(sender.postMessage).toHaveBeenCalledTimes(3);
      expect(sender.postMessage).toHaveBeenCalledWith('my data', '*');
    });

    it('should call addEventListener on receiver', () => {
      expect(receiver.addEventListener).toHaveBeenCalledTimes(3);
      expect(receiver.addEventListener).toHaveBeenCalledWith('message', listenerAdd);
    });

    it('should call removeEventListener on receiver', () => {
      expect(receiver.removeEventListener).toHaveBeenCalledTimes(3);
      expect(receiver.removeEventListener).toHaveBeenCalledWith('message', listenerRemove);
    });
  });
});
