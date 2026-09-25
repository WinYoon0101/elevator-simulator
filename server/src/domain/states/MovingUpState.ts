import { Direction } from '../Direction';
import { Elevator } from '../Elevator';
import { ElevatorState } from './ElevatorState';
import { MovingState } from './MovingState';
import { MovingDownState } from './MovingDownState';
import { anyGreaterThan } from './scanUtils';

/**
 * Concrete state: car is climbing. Inherits the whole SCAN algorithm from
 * `MovingState` and only fills in the direction-specific details - this is
 * the class that demonstrates inheritance (extends) on top of the
 * interface-based polymorphism already used across the State pattern.
 */
export class MovingUpState extends MovingState {
  getDirection(): Direction {
    return Direction.UP;
  }

  protected nextFloor(current: number): number {
    return current + 1;
  }

  protected primaryRequests(elevator: Elevator): Set<number> {
    return elevator.getUpRequests();
  }

  protected secondaryRequests(elevator: Elevator): Set<number> {
    return elevator.getDownRequests();
  }

  protected hasWorkAhead(requests: Set<number>, floor: number): boolean {
    return anyGreaterThan(requests, floor);
  }

  protected isSameDirection(current: number, floor: number, direction: Direction | null): boolean {
    return floor > current && direction !== Direction.DOWN;
  }

  protected createOppositeState(): ElevatorState {
    return new MovingDownState();
  }
}
