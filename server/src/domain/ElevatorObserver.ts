import { Elevator } from './Elevator';

/**
 * Observer pattern: anything that needs to react whenever an elevator's
 * state changes (position, direction, door) implements this interface.
 * The Socket.io broadcaster is the concrete observer used in this project.
 */
export interface ElevatorObserver {
  update(elevator: Elevator): void;
}
