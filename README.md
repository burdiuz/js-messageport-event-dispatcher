# MessagePortDispatcher

[![Build Status](https://travis-ci.org/burdiuz/js-messageport-event-dispatcher.svg?branch=master)](https://travis-ci.org/burdiuz/js-messageport-event-dispatcher)
[![Coverage Status](https://coveralls.io/repos/github/burdiuz/js-messageport-event-dispatcher/badge.svg?branch=master)](https://coveralls.io/github/burdiuz/js-messageport-event-dispatcher?branch=master)

MessagePortDispatcher is extended API for cross-origin communication. It utilizes [MessagePort API](https://developer.mozilla.org/en-US/docs/Web/API/MessagePort) available on `window` object to send custom events into/from &lt;IFRAME/&gt; or other target that implements MessagePort interface. MessagePortDispatcher uses two [EventDispatcher's](https://github.com/burdiuz/js-event-dispatcher) for incoming and outgoing events internally.

[Demo with two &lt;iframe/&gt;'s talking to each other](http://burdiuz.github.io/js-messageport-event-dispatcher/)

## Installation
Easy to install with [npm](https://www.npmjs.com/) package manager
```javascript
npm install --save @actualwave/messageport-dispatcher
```
with [yarn](https://yarnpkg.com/) package manager
```javascript
yarn add @actualwave/messageport-dispatcher
```

## Usage

> Note: MessagePortDispatcher distribution package contains `dist/` folder with package wrapped into [UMD](https://github.com/umdjs/umd) wrapper, so it can be used with any AMD module loader, nodejs `require()` or without any.

To start using EventDispatcher, just instantiate it
```javascript
const dispatcher = new MessagePortDispatcher(iframe.contentWindow);
```
As first argument its constructor accepts object that implements messaging methods of [MessagePort](https://developer.mozilla.org/en-US/docs/Web/API/MessagePort) interface.

 - [postMessage(message:Object)](https://developer.mozilla.org/en-US/docs/Web/API/MessagePort/postMessage)
 - [addEventDispatcher(type:String, handler:Function)](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener)
 - [removeEventDispatcher(type:String, handler:Function)](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/removeEventListener)

Window object or Dedicated Worker can be used, to communicate with other side of communication channel(send event to script in IFRAME or from IFRAME or to Worker).  To have custom events working on both sides, MessagePortDispatcher instances should be created from both sides of communication channel.
In outer document pass IFRAME's window object
```javascript
const frameDispatcher = new MessagePortDispatcher(iframeNode.contentWindow);
frameDispatcher.addEventListener('initialized', () => {
	console.log('Ok, we can start communication.');
});
```
In IFRAME use `window.self`
```javascript
const dispatcher = MessagePortDispatcher.self();
dispatcher.dispatchEvent('initialized');
```
Instances returned from `MessagePortDispatcher.self()`, `MessagePortDispatcher.parent()` and `MessagePortDispatcher.top()` are cached internally, so will always return same instance.

Its possible to write an adapter for any object and pass it into MessagePortDispatcher
```javascript
const target = {
	postMessage: (data, origin) => {
		console.log('Message sent', data);
		window.postMessage(data, origin);
	},
	addEventListener: (eventType, handler) => {
		console.log('Event listener added to ', eventType);
		window.addEventListener(eventType, handler);
	},
	removeEventListener: (eventType, handler) => {
		console.log('Event listener removed from ', eventType);
		window.removeEventListener(eventType, handler);
	}
};
const dispatcher = new MessagePortDispatcher(target);
```

Once its instance was created, you can send events into `iframe`
```javascript
dispatcher.dispatchEvent('someEvent', {someData: 'anything here'});
```
and catch it on other side
```javascript
dispatcher.addEventListener('someEvent', (event) => {
console.log('Data received', event.data);
});
```
When `MessagePortDispatcher.dispatchEvent()` called, it actually calls `postMessage()` method to pass message to other side. So instead of using `postMessage` and listening to `message` event, with MessagePortDispatcher you can send and receive custom events.

When MessagePortDispatcher instantiated, it creates two EventDispatcher's, one for incoming events and second for outgoing. Since Window object fires same `message` event for both sides, under the hood MessagePortDispatcher adds own ID to each event and if received event has same ID, it will be fired via`sender`(outgoing event) EventDispatcher, otherwise via `receiver`(incoming event).
This will not work, event `someEvent` will be fired on other side but not for this dispatcher:
```javascript
dispatcher.addEventListener('someEvent', () => {
	console.log('Some Event Received!');
});
dispatcher.dispatchEvent('someEvent');
```
If you want to listen for outgoing events, use `sender`:
```javascript
dispatcher.sender.addEventListener('someEvent', () => {
	console.log('Some Event Received!');
});
dispatcher.dispatchEvent('someEvent');
```
Using same event types on both sides of communication channel will not mix them, since they will be fired from different dispatchers.

MessagePortDispatcher has exposed methods from `receiver` EventDispatcher for easier usage and custom `dispatchEvent()` method that sends events using `MessagePort.postMessage()`.
These two calls are equivalent:
```javascript
dispatcher.addEventListener('someEvent', () => {});
dispatcher.receiver.addEventListener('someEvent', () => {});
```
But these lines do different things:
```javascript
dispatcher.dispatchEvent('someEvent');
dispatcher.sender.dispatchEvent('someEvent');
```
`sender.dispatchEvent()` will just fire event from sender EventDispatcher, but `MessagePortDispatcher.dispatchEvent()` will actually send message to other side via `postMessage()`.

Since MessagePortDispatcher passes data between origins, it can send only simple data(i.e. nothing can be sent by reference) that can be converted to JSON. Before sending event, it checks its data property value. If this value has method `toJSON()`, it will use it and send returned data as is. In other case the value will be converted to JSON string before being sent and converted back when received. When using `toJSON()` method its developer's responsibility to look for nested data objects and convert everything to transferable simple objects.

Project contains example in `example` folder, it shows how to use MessagePortDispatcher when communicating with frames.

## API

#### MessagePortDispatcher constructor arguments
 - **target**:Object - Requred, target object, should have postMessage(), addEventListener(), removeEventListener() methods, asdescribed in [MessagePort docs](https://developer.mozilla.org/en-US/docs/Web/API/MessagePort).
 - **customPostMessageHandler**:Function -  will be used to call `target.postMessage()`
 - **receiverEventPreprocessor**:Function - Optional, allows pre-processing of events and their data before firing event.
 - **senderEventPreprocessor**:Function - Optional, , allows pre-processing of events and their data before passing them to `postMessage` or `customPostMessageHandler`.

#### MessagePortDispatcher instance members
 - **targetOrigin**:String
 - **sender**:EventDispatcher - fires outgoing events that are passed to `postMessage()`
 - **receiver**:EventDispatcher - fires incoming events received from other origin
 - **target**:Object - target object that is used for communication
 - **dispatcherId**:String - unique ID of current MessagePortDispatcher instance
 - **addEventListener**(eventType:String, listener:Function):void - method copied from `receiver` EventDispatcher for easier access
 - **hasEventListener**(eventType:String):Boolean - method copied from `receiver` EventDispatcher for easier access
 - **removeEventListener**(eventType:String, listener:Function):void - method copied from `receiver` EventDispatcher for easier access
 - **removeAllEventListeners**(eventType:String):void - method copied from `receiver` EventDispatcher for easier access
 - **dispatchEvent**(event:Object):void - does not fire event, it sends event to `postMessage()`. Can be used with two arguments:
 - - dispatchEvent(eventType:String, data?:Object):void

#### MessagePortTarget
A class that is used as a surrogate target for MessagePortDispatcher, it is useful when you have two objects for sending and receiving messages. For example, when you have an iframe with content from another origin and you can set iframe.contentWindow as sender object and own window as receiver. Sender object must contain `postMessage()` method and receiver object -- `addEventListener()` and `removeEventListener()` methods. Pass both sender and receiver into MessagePortTarget constructor, then it's instance can be provided for MessagePortDispatcher.
```javascript
const frameDispatcher = new MessagePortDispatcher(new MessagePortTarget(iframeNode.contentWindow, window));
```
It also accepts lists of senders and receivers for mass sending and receiving.
```javascript
const frameDispatcher = new MessagePortDispatcher(new MessagePortTarget([
  iframe1.contentWindow,
  iframe2.contentWindow,
  iframe3.contentWindow
  ], window));
```
