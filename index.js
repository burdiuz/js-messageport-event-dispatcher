'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var eventDispatcher = require('@actualwave/event-dispatcher');

/* eslint-disable @typescript-eslint/no-explicit-any */
class MessagePortTarget {
    constructor(sender, receiver) {
        this.sender = sender ? (Array.isArray(sender) ? sender : [sender]) : [];
        this.receiver = receiver ? (Array.isArray(receiver) ? receiver : [receiver]) : [];
    }
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

const isObject = (value) => typeof value === 'object' && value !== null;
const createId = () => `MP/${Math.ceil(Math.random() * 10000)}/${Date.now()}`;
/**
 * If toJSON method is implemented on the object, it will be called instead of converting to a
 * JSON string. This utilises the structured cloning algorithm for raw objects.
 * https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm
 * In this case the developer is responsible for converting nested objects.
 */
const toRawData = (object) => {
    if (typeof object.toJSON === 'function') {
        return object.toJSON();
    }
    return JSON.stringify(object);
};
const parseRawData = (data) => {
    if (isObject(data)) {
        return data;
    }
    try {
        return JSON.parse(data);
    }
    catch {
        // not a valid JSON event
    }
    return undefined;
};

class MessagePortEvent {
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
const isMessagePortEvent = (object) => typeof object === 'object' &&
    object !== null &&
    Object.hasOwn(object, 'dispatcherId') &&
    Object.hasOwn(object, 'event');
const parseMessagePortEvent = (object) => {
    const result = parseRawData(object);
    if (result && isMessagePortEvent(result)) {
        const { event, dispatcherId } = result;
        return new MessagePortEvent(parseRawData(event), dispatcherId);
    }
    return null;
};

/* eslint-disable no-restricted-globals, @typescript-eslint/no-explicit-any */
class MessagePortDispatcher {
    constructor(target = null, customPostMessageHandler = null, receiverEventPreprocessor = null, senderEventPreprocessor = null) {
        this.dispatcherId = createId();
        this.targetOrigin = '*';
        this.target = target ?? self;
        this.customPostMessageHandler = customPostMessageHandler;
        this.senderEventPreprocessor = senderEventPreprocessor;
        this.sender = eventDispatcher.createEventDispatcher();
        this.receiver = eventDispatcher.createEventDispatcher(receiverEventPreprocessor ?? undefined);
        this.target.addEventListener('message', (event) => this._postMessageListener(event));
    }
    addEventListener(eventType, listener, priority) {
        this.receiver.addEventListener(eventType, listener, priority);
    }
    hasEventListener(eventType) {
        return this.receiver.hasEventListener(eventType);
    }
    removeEventListener(eventType, listener) {
        this.receiver.removeEventListener(eventType, listener);
    }
    removeAllEventListeners(eventType) {
        this.receiver.removeAllEventListeners(eventType);
    }
    dispatchEvent(eventType, data, transferList) {
        let event = typeof eventType === 'string' ? { type: eventType, data } : eventType;
        if (this.senderEventPreprocessor) {
            event = this.senderEventPreprocessor(event);
        }
        const eventJson = toRawData(new MessagePortEvent(event, this.dispatcherId));
        this._postMessageHandler(eventJson, transferList);
    }
    _postMessageHandler(data, transferList) {
        const handler = this.customPostMessageHandler;
        if (handler) {
            handler.call(this, data, this.targetOrigin, transferList);
            return;
        }
        this.target.postMessage(data, this.targetOrigin, transferList);
    }
    _postMessageListener(event) {
        // .nativeEvent is a React Native property containing the event from WebView
        const nativeEvent = event.nativeEvent ?? event;
        const message = parseMessagePortEvent(nativeEvent.data);
        if (message) {
            if (message.dispatcherId === this.dispatcherId) {
                this.sender.dispatchEvent(message.event);
            }
            else {
                this.receiver.dispatchEvent(message.event);
            }
        }
    }
}
const createMessagePortDispatcher = (target, customPostMessageHandler, receiverEventPreprocessor, senderEventPreprocessor) => new MessagePortDispatcher(target ?? null, customPostMessageHandler ?? null, receiverEventPreprocessor ?? null, senderEventPreprocessor ?? null);
const factory = (getTarget) => {
    let dispatcher = null;
    return () => {
        if (!dispatcher) {
            dispatcher = createMessagePortDispatcher(getTarget());
        }
        return dispatcher;
    };
};
const getForSelf = factory(() => self);
const getForParent = factory(() => parent);
const getForTop = factory(() => top);

exports.MessagePortDispatcher = MessagePortDispatcher;
exports.MessagePortEvent = MessagePortEvent;
exports.MessagePortTarget = MessagePortTarget;
exports.createMessagePortDispatcher = createMessagePortDispatcher;
exports.default = MessagePortDispatcher;
exports.getForParent = getForParent;
exports.getForSelf = getForSelf;
exports.getForTop = getForTop;
exports.isMessagePortEvent = isMessagePortEvent;
exports.parseMessagePortEvent = parseMessagePortEvent;
//# sourceMappingURL=index.js.map
