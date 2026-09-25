import { Direction } from '../Direction';
import { Elevator } from '../Elevator';
import { ElevatorState } from './ElevatorState';
import { MovingState } from './MovingState';
import { MovingUpState } from './MovingUpState';
import { anyLessThan } from './scanUtils';

/** Mirror image of MovingUpState - same inherited algorithm, opposite direction. */
export class MovingDownState extends MovingState {
  getDirection(): Direction {
    return Direction.DOWN;
  }

  protected nextFloor(current: number): number {
    return current - 1;
  }

  protected primaryRequests(elevator: Elevator): Set<number> {
    return elevator.getDownRequests();
  }

  protected secondaryRequests(elevator: Elevator): Set<number> {
    return elevator.getUpRequests();
  }

  protected hasWorkAhead(requests: Set<number>, floor: number): boolean {
    return anyLessThan(requests, floor);
  }

  protected isSameDirection(current: number, floor: number, direction: Direction | null): boolean {
    return floor < current && direction !== Direction.UP;
  }

  protected createOppositeState(): ElevatorState {
    return new MovingUpState();
  }
}
