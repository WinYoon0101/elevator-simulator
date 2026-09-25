import { Direction } from '../Direction';
import { Elevator } from '../Elevator';

/**
 * State pattern: each concrete state (Idle / MovingUp / MovingDown)
 * decides differently how a new request is queued and how a single
 * simulation tick moves the car. This is where the "only stop if the
 * elevator is already heading the same way" rule from the spec lives.
 */
export interface ElevatorState {
  addRequest(elevator: Elevator, floor: number, direction: Direction | null): void;
  move(elevator: Elevator): void;
  getDirection(): Direction;
}
