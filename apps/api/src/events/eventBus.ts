import { EventEmitter } from 'events';
import { logger } from '../config/logger.js';

export interface DomainEvent {
  type: string;
  payload: Record<string, unknown>;
  timestamp: Date;
}

class EventBus extends EventEmitter {
  emit(event: string, payload: Record<string, unknown>): boolean {
    logger.debug(`Event emitted: ${event}`, { event });
    return super.emit(event, {
      type: event,
      payload,
      timestamp: new Date(),
    } satisfies DomainEvent);
  }

  onEvent(event: string, handler: (data: DomainEvent) => void | Promise<void>): void {
    this.on(event, (data: DomainEvent) => {
      Promise.resolve(handler(data)).catch((err) => {
        logger.error(`Event handler error for ${event}`, { error: err });
      });
    });
  }
}

export const eventBus = new EventBus();
