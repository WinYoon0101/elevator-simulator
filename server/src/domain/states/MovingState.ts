import { Direction } from '../Direction';
import { Elevator } from '../Elevator';
import { ElevatorState } from './ElevatorState';
import { IdleState } from './IdleState';

/**
 * MovingUpState and MovingDownState are mirror images of each other - same
 * SCAN algorithm, opposite direction. This abstract base class implements
 * that shared algorithm once (addRequest + move), and leaves only the
 * direction-specific pieces (which request set is "primary", which way is
 * "ahead", how to build the opposite state, ...) as abstract methods for
 * the subclasses to fill in.
 *
 * This is the inheritance leg of the OOP trio the brief asks for:
 * MovingUpState / MovingDownState extend this class and override its
 * abstract methods, while `move()`/`addRequest()` here are only ever
 * invoked polymorphically through the `ElevatorState` interface.
 */
export abstract class MovingState implements ElevatorState {
  abstract getDirection(): Direction;

  /** The floor the car lands on after one tick of travel in this direction. */
  protected abstract nextFloor(current: number): number;

  /** Requests served while travelling in this state's own direction. */
  protected abstract primaryRequests(elevator: Elevator): Set<number>;

  /** Requests filed for the reverse leg, served once this run turns around. */
  protected abstract secondaryRequests(elevator: Elevator): Set<number>;

  /** True if `requests` still has something beyond `floor` in this direction. */
  protected abstract hasWorkAhead(requests: Set<number>, floor: number): boolean;

  /** True if a newly filed request continues in this state's own direction. */
  protected abstract isSameDirection(current: number, floor: number, direction: Direction | null): boolean;

  /** The state to switch to once this run turns around. */
  protected abstract createOppositeState(): ElevatorState;

  addRequest(elevator: Elevator, floor: number, direction: Direction | null): void {
    const current = elevator.getCurrentFloor();

    if (floor === current && direction === null) {
      // Car call for the floor we're mid-transit through: nothing to do.
      return;
    }

    if (this.isSameDirection(current, floor, direction)) {
      this.primaryRequests(elevator).add(floor);
    } else {
      // Behind us, or a call for the opposite direction: served after we turn around.
      this.secondaryRequests(elevator).add(floor);
    }
  }

  move(elevator: Elevator): void {
    const current = elevator.getCurrentFloor();
    const primary = this.primaryRequests(elevator);
    const secondary = this.secondaryRequests(elevator);

    const hasWorkAhead = this.hasWorkAhead(primary, current) || this.hasWorkAhead(secondary, current);

    if (!hasWorkAhead) {
      // Nothing left ahead: flip direction (or go idle) without moving, so
      // the car never overshoots the end of its run before reversing.
      if (secondary.size > 0) {
        elevator.setState(this.createOppositeState());
      } else if (primary.size === 0) {
        elevator.setState(new IdleState());
      }
      return;
    }

    const next = this.nextFloor(current);
    elevator.setCurrentFloor(next);

    if (primary.has(next)) {
      primary.delete(next);
      elevator.openDoorAt(next);
      return;
    }

    // Not a primary stop, but if nothing remains ahead of this new floor,
    // it's the turning point of the run - also serve a call parked exactly here.
    const stillWorkAhead = this.hasWorkAhead(primary, next) || this.hasWorkAhead(secondary, next);
    if (!stillWorkAhead && secondary.has(next)) {
      secondary.delete(next);
      elevator.openDoorAt(next);
    }
  }
}
