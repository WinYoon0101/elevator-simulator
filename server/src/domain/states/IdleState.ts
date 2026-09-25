import { Direction } from '../Direction';
import { Elevator } from '../Elevator';
import { ElevatorState } from './ElevatorState';
import { MovingUpState } from './MovingUpState';
import { MovingDownState } from './MovingDownState';
import { anyGreaterThan, anyLessThan } from './scanUtils';

export class IdleState implements ElevatorState {
  getDirection(): Direction {
    return Direction.IDLE;
  }

  addRequest(elevator: Elevator, floor: number, direction: Direction | null): void {
    const current = elevator.getCurrentFloor();
    
    if (floor === current && direction === null) {
      return;
    }

    if (direction === Direction.DOWN) {
      elevator.getDownRequests().add(floor);
    } else if (direction === Direction.UP) {
      elevator.getUpRequests().add(floor);
    } else {
      if (floor > current) elevator.getUpRequests().add(floor);
      else if (floor < current) elevator.getDownRequests().add(floor);
    }

    if (floor > current) {
      elevator.setState(new MovingUpState());
    } else if (floor < current) {
      elevator.setState(new MovingDownState());
    }
  }

  move(elevator: Elevator): void {
    const current = elevator.getCurrentFloor();
    const upReqs = elevator.getUpRequests();
    const downReqs = elevator.getDownRequests();

    const workAbove = anyGreaterThan(upReqs, current) || anyGreaterThan(downReqs, current);
    const workBelow = anyLessThan(upReqs, current) || anyLessThan(downReqs, current);

    if (workAbove) {
      elevator.setState(new MovingUpState());
    } else if (workBelow) {
      elevator.setState(new MovingDownState());
    }
  }
}
