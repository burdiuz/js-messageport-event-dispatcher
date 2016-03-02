# MessagePortDispatcher

[![Build Status](https://travis-ci.org/burdiuz/js-messageport-event-dispatcher.svg?branch=master)](https://travis-ci.org/burdiuz/js-messageport-event-dispatcher)
[![Coverage Status](https://coveralls.io/repos/github/burdiuz/js-messageport-event-dispatcher/badge.svg?branch=master)](https://coveralls.io/github/burdiuz/js-messageport-event-dispatcher?branch=master)

MessagePortDispatcher is extended API for cross-origin communication. It utilizes `MessagePort` API available on `window` object to send custom events into/from `iframe` or other target that implements `MessagePort` interface. MessagePortDispatcher uses two [EventDispatcher's](https://github.com/burdiuz/js-event-dispatcher) to sent and received events internally.


## Installation
MessagePortDispatcher is available via [bower](http://bower.io/)
```
bower install messageport-dispatcher --save
```
If you want to use it with [npm](https://www.npmjs.com/) package manger, add it to `dependencies`section of your package.json file.
```javascript
"dependencies": {
  "messageport-dispatcher": "git://github.com/burdiuz/js-messageport-event-dispatcher.git"
}
```

## Usage
MessagePortDispatcher distribution package is wrapped into [UMD](https://github.com/umdjs/umd) wrapper, so it can be used with any AMD module loader, nodejs `require()` or without any.
To start using EventDispatcher, just instantiate it
```javascript
var dispatcher = new MessagePortDispatcher(iframe.contentWindow);
```
As first argument its constructor accepts object that implements messaging methods of [MessagePort](https://developer.mozilla.org/en-US/docs/Web/API/MessagePort) interface.
*  [postMessage(message:Object)](https://developer.mozilla.org/en-US/docs/Web/API/MessagePort/postMessage)
*  [addEventDispatcher(type:String, handler:Function)](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener)
*  [removeEventDispatcher(type:String, handler:Function)](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/removeEventListener)
Window object or Dedicated Worker can be used, to communicate with other side of communication channel(send event to script in IFRAME or from IFRAME or to Worker).  To have custom events working on both sides, MessagePortDispatcher instances should be created from both sides of communication channel.
In outer document pass IFRAME's window object
```javascript
var frameDispatcher = new MessagePortDispatcher(iframeNode.contentWindow);
frameDispatcher.addEventListener('initialized', function() {
	console.log('Ok, we can start communication.');
});
```
In IFRAME use `window.self`
```javascript
var dispatcher = MessagePortDispatcher.self();
dispatcher.dispatchEvent('initialized');
```
Instances returned from `MessagePortDispatcher.self()`, `MessagePortDispatcher.parent()` and `MessagePortDispatcher.top()` are cached internally, so will always return same instance.

Its possible to write an adapter for any object and pass it into MessagePortDispatcher
```javascript
var target = {
	postMessage: function(data, origin) {
		console.log('Message sent', data);
		window.postMessage(data, origin);
	},
	addEventLsitener: function(eventType, handler) {
		console.log('Event listener added to ', eventType);
		window.addEventListener(eventType, handler);
	},
	removeEventLsitener: function(eventType, handler) {
		console.log('Event listener removed from ', eventType);
		window.removeEventLsitener(eventType, handler);
	}
};
var dispatcher = new MessagePortDispatcher(target);
```

When MessagePortDispatcher created, it created two EventDispatcher's, one for sent events and second for received. Since Window object fires `message` event for both sides, under the hood MessagePortDispatcher adds own ID to each event and if received event has same ID, it will be fired via`sender` EventDispatcher, otherwise via `receiver`. This gives confidence that in cases developer will use same events on both sides, he will receive proper events on other side.

MessagePortDispatcher has exposed methods from `receiver` EventDispatcher for easier usage and custom `dispatchEvent()` method that sends events using `MessagePort.postMessage()`.

Once its instance was created, you can send events into `iframe`
```javascript
dispatcher.dispatchEvent('someEvent', {someData: 'anything here'});
```
and catch it on other side
```javascript
dispatcher.addEventListener('someEvent', function(event) {
console.log('Data received', event.data);
});
```
When `MessagePortDispatcher.dispatchEvent()` called, it actually calls `postMessage()` method to pass message to other side. So instead of using `postMessage` and listening to `message` event, with MessagePortDispatcher you can send and receive custom events.  

Since MessagePortDispatcher passes data between origins,it can send only simple data(i.e. nothing can be sent by reference) that can be converted to JSON. Before sending event, it checks its data property value. If this value has method `toJSON()`, it will use it and send returned data as is. In other case the value will be converted to JSON string to send and converted back when received. When using `toJSON()` method its developer's responsibility to look for nested data objects and convert everything to transferable simple objects.

Project contains example in `example` folder, it shows how to use MessagePortDispatcher when communicating with frames.

## API

#### MessagePortDispatcher constructor arguments
 - **target:Object** - Requred, target object, should have postMessage(), addEventListener(), removeEventListener() methods, asdescribed in [MessagePort docs](https://developer.mozilla.org/en-US/docs/Web/API/MessagePort).
 - **customPostMessageHandler:Function** -  will be used to call `target.postMessage()`
 - **receiverEventPreprocessor:Function** - Optional, allows pre-processing of events and their data before firing event.
 - **senderEventPreprocessor:Function** - Optional, , allows pre-processing of events and their data before passing them to `postMessage` or `customPostMessageHandler`.

#### MessagePortDispatcher instance members
 - **targetOrigin:String**
 - **sender:EventDispatcher** - fires events that are passed to `postMessage()`
 - **receiver:EventDispatcher** - fires events received from other origin
 - **target:Object** - target object that is used for communication
 - **dispatcherId:String** - unique ID of current MessagePortDispatcher instance
 - **addEventListener(eventType:String, listener:Function):void** - method copied from `receiver` EventDispatcher for easier access
 - **hasEventListener(eventType:String):Boolean** - method copied from `receiver` EventDispatcher for easier access
 - **removeEventListener(eventType:String, listener:Function):void** - method copied from `receiver` EventDispatcher for easier access
 - **removeAllEventListeners(eventType:String):void** - method copied from `receiver` EventDispatcher for easier access
 - **dispatchEvent(event:Object):void** - does not fire event, it sends event to `postMessage()`. Also accepts two arguments: `dispatchEvent(eventType:String, data?:Object):void`

#### MessagePortDispatcher static members
 - **toJSON(data:Object):Object|String** - Convers event to JSON string or if `event.data` field contains object with 'toJSON()' method, will call it and return Object with its return value.  *Methods `toJSON()` and `fromJSON()` can be replaced with custom implementations.*
 - **fromJSON(data:Object|String):Object** - Accepts Object or String, JSON String. If string passed, it will be converted to Object with "JSON.parse()".
 - **self(receiverEventPreprocessor?:Function, senderEventPreprocessor?:Function):MessagePortDispatcher** - Creates MessagePortDispatcher using as target object value of globally available `self` variable(window.self, WorkerGlobalScope.self).
 - **parent(receiverEventPreprocessor?:Function, senderEventPreprocessor?:Function):MessagePortDispatcher** - Creates MessagePortDispatcher using as target object value of globally available `self` variable(window.parent).
 - **top(receiverEventPreprocessor?:Function, senderEventPreprocessor?:Function):MessagePortDispatcher** - Creates MessagePortDispatcher using as target object value of globally available `self` variable(window.top).