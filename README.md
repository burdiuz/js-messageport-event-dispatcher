# MessagePortDispatcher

MessagePortDispatcher is an extended API for cross-origin communication. It wraps the [MessagePort API](https://developer.mozilla.org/en-US/docs/Web/API/MessagePort) available on `window`, Worker, and other targets to send and receive typed custom events across `<iframe>` boundaries, Web Workers, and any object that implements the MessagePort interface. Internally it uses two [EventDispatcher](https://github.com/burdiuz/js-event-dispatcher) instances — one for incoming events and one for outgoing.

[Demo with two &lt;iframe&gt;'s talking to each other](http://burdiuz.github.io/js-messageport-event-dispatcher/)

## Installation

```bash
npm install @actualwave/messageport-dispatcher
```
```bash
yarn add @actualwave/messageport-dispatcher
```

## Usage

Instantiate with any object that implements the [MessagePort](https://developer.mozilla.org/en-US/docs/Web/API/MessagePort) interface (`postMessage`, `addEventListener`, `removeEventListener`):

```typescript
const dispatcher = new MessagePortDispatcher(iframe.contentWindow);
```

### Communicating across an iframe boundary

In the outer document, pass the iframe's `contentWindow`:

```typescript
import { MessagePortDispatcher } from '@actualwave/messageport-dispatcher';

const frameDispatcher = new MessagePortDispatcher(iframeNode.contentWindow);
frameDispatcher.addEventListener('initialized', () => {
  console.log('Communication channel is open.');
});
```

Inside the iframe, use `getForSelf()`:

```typescript
import { getForSelf } from '@actualwave/messageport-dispatcher';

const dispatcher = getForSelf();
dispatcher.dispatchEvent('initialized');
```

`getForSelf()`, `getForParent()`, and `getForTop()` return cached singletons, so they always return the same instance.

### Sending and receiving events

```typescript
// Send to the other side
dispatcher.dispatchEvent('someEvent', { someData: 'anything here' });

// Receive on the other side
dispatcher.addEventListener('someEvent', (event) => {
  console.log('Data received', event.data);
});
```

`dispatchEvent()` serialises the event and calls `postMessage()` — it does **not** fire the event locally on `receiver`. To observe sent events locally, listen on `sender`:

```typescript
dispatcher.sender.addEventListener('someEvent', () => {
  console.log('Outgoing event observed');
});
dispatcher.dispatchEvent('someEvent');
```

### Custom adapter target

```typescript
const target = {
  postMessage: (data, origin) => {
    console.log('Message sent', data);
    window.postMessage(data, origin);
  },
  addEventListener: (eventType, handler) => {
    window.addEventListener(eventType, handler);
  },
  removeEventListener: (eventType, handler) => {
    window.removeEventListener(eventType, handler);
  },
};
const dispatcher = new MessagePortDispatcher(target);
```

### MessagePortTarget

`MessagePortTarget` is a convenience wrapper for cases where sending and receiving are handled by different objects — for example, an iframe's `contentWindow` for sending and your own `window` for receiving:

```typescript
import { MessagePortDispatcher, MessagePortTarget } from '@actualwave/messageport-dispatcher';

const frameDispatcher = new MessagePortDispatcher(
  new MessagePortTarget(iframeNode.contentWindow, window),
);
```

It also accepts arrays for broadcasting to or receiving from multiple targets:

```typescript
const frameDispatcher = new MessagePortDispatcher(
  new MessagePortTarget(
    [iframe1.contentWindow, iframe2.contentWindow, iframe3.contentWindow],
    window,
  ),
);
```

### Data serialisation

Because events cross origin boundaries, only serialisable data can be transferred. Before sending, `dispatchEvent` checks the event's data value:

- If the value has a `toJSON()` method, its return value is sent as-is (structured clone). The developer is responsible for converting nested objects.
- Otherwise the value is `JSON.stringify`-d, then parsed back on the receiving side.

### Dispatcher ID and echo suppression

Each `MessagePortDispatcher` instance generates a unique `dispatcherId`. When a sent event is echoed back (which happens with `window.postMessage`), the dispatcher detects its own ID and routes the echo to the `sender` EventDispatcher instead of `receiver`, preventing false local dispatch.

## API

### `MessagePortDispatcher` constructor

| Parameter | Type | Description |
|---|---|---|
| `target` | `MessagePortLike \| null` | Object with `postMessage` and `addEventListener`. Defaults to `self`. |
| `customPostMessageHandler` | `Function \| null` | Replaces the default `target.postMessage()` call. |
| `receiverEventPreprocessor` | `EventProcessor \| null` | Transforms incoming events before listeners are called. |
| `senderEventPreprocessor` | `EventProcessor \| null` | Transforms outgoing events before `postMessage` is called. |

### `MessagePortDispatcher` instance members

| Member | Type | Description |
|---|---|---|
| `dispatcherId` | `string` | Unique ID for this instance. |
| `targetOrigin` | `string` | Passed to `postMessage` as the target origin. Defaults to `'*'`. |
| `target` | `MessagePortLike` | The underlying message port object. |
| `sender` | `IEventDispatcher` | Fires outgoing events (echoes of sent messages). |
| `receiver` | `IEventDispatcher` | Fires incoming events received from the other side. |
| `addEventListener(type, listener, priority?)` | `void` | Delegates to `receiver.addEventListener`. |
| `hasEventListener(type)` | `boolean` | Delegates to `receiver.hasEventListener`. |
| `removeEventListener(type, listener)` | `void` | Delegates to `receiver.removeEventListener`. |
| `removeAllEventListeners(type)` | `void` | Delegates to `receiver.removeAllEventListeners`. |
| `dispatchEvent(eventType, data?, transferList?)` | `void` | Serialises and sends the event via `postMessage`. |

### Factory functions

| Function | Description |
|---|---|
| `getForSelf()` | Cached dispatcher for `self` (current window / worker). |
| `getForParent()` | Cached dispatcher for `parent` window. |
| `getForTop()` | Cached dispatcher for `top` window. |
| `createMessagePortDispatcher(target?, ...)` | Creates a new `MessagePortDispatcher` instance. |

### `MessagePortTarget`

| Member | Description |
|---|---|
| `constructor(sender?, receiver?)` | Accepts single objects or arrays of objects for each role. |
| `postMessage(...args)` | Calls `postMessage` on all senders. |
| `addEventListener(type, handler)` | Calls `addEventListener` on all receivers. |
| `removeEventListener(type, handler)` | Calls `removeEventListener` on all receivers. |

## TypeScript

The package ships with TypeScript declarations. Types from `@actualwave/event-dispatcher` are also available for event typing:

```typescript
import {
  MessagePortDispatcher,
  MessagePortTarget,
  MessagePortEvent,
  createMessagePortDispatcher,
  getForSelf,
  getForParent,
  getForTop,
} from '@actualwave/messageport-dispatcher';

import type { EventListener, EventProcessor } from '@actualwave/event-dispatcher';

const preprocessor: EventProcessor = (event) => {
  return { ...event, data: { ...(event.data as object), timestamp: Date.now() } };
};

const dispatcher = new MessagePortDispatcher(iframe.contentWindow, null, preprocessor);

const handler: EventListener = (event) => {
  console.log(event.type, event.data);
};

dispatcher.addEventListener('myEvent', handler);
dispatcher.dispatchEvent('myEvent', { payload: 42 });
```
