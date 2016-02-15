/**
 * Created by Oleg Galaburda on 09.12.15.
 */
// Uses Node, AMD or browser globals to create a module.
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['EventDispatcher'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // Node. Does not work with strict CommonJS, but
    // only CommonJS-like environments that support module.exports,
    // like Node.
    module.exports = factory(require('EventDispatcher'));
  } else {
    // Browser globals (root is window)
    root.MessagePortDispatcher = factory(root.EventDispatcher);
  }
}(this, function (EventDispatcher) {
  // here should be injected messageport-event-dispatcher.js content
  //=require messageport-event-dispatcher.js
  return MessagePortDispatcher;
}));
