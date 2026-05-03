declare module '@actualwave/event-dispatcher' {
  export interface EventObject {
    type: string;
    data?: unknown;
  }

  export interface DispatchedEvent extends EventObject {
    stopPropagation(): void;
    stopImmediatePropagation(): void;
    preventDefault(): void;
    isDefaultPrevented(): boolean;
  }

  export type EventType = string | EventObject;
  export type EventListener = (event: DispatchedEvent) => void;
  export type EventProcessor = (event: EventObject) => EventObject;

  export interface IEventDispatcher {
    addEventListener(eventType: string, listener: EventListener, priority?: number): void;
    hasEventListener(eventType: string): boolean;
    removeEventListener(eventType: string, listener: EventListener): void;
    removeAllEventListeners(eventType: string): void;
    dispatchEvent(event: EventType, data?: unknown): void;
  }

  export function createEventDispatcher(preprocessor?: EventProcessor): IEventDispatcher;

  export class EventDispatcher implements IEventDispatcher {
    constructor(preprocessor?: EventProcessor);
    addEventListener(eventType: string, listener: EventListener, priority?: number): void;
    hasEventListener(eventType: string): boolean;
    removeEventListener(eventType: string, listener: EventListener): void;
    removeAllEventListeners(eventType: string): void;
    dispatchEvent(event: EventType, data?: unknown): void;
  }

  export default EventDispatcher;
}
