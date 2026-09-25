import { Direction } from '../Direction';
import { Elevator } from '../Elevator';
import { HallCall } from '../requests/HallCall';
import { ElevatorSelectionStrategy } from './ElevatorSelectionStrategy';

/**
 * Picks the elevator that can reach the call soonest:
 *  - idle elevators are scored purely by distance
 *  - elevators already moving toward the call, in the same direction as
 *    the call, are scored by distance too
 *  - everything else (moving away, or moving toward but wrong direction)
 *    is penalized so it's only chosen if nothing better exists
 */
export class NearestElevatorStrategy implements ElevatorSelectionStrategy {
  selectElevator(elevators: Elevator[], call: HallCall): Elevator {
    const ranked = elevators
      .map((elevator) => ({ elevator, score: this.score(elevator, call) }))
      .sort((a, b) => a.score - b.score);

    return ranked[0].elevator;
  }

  private score(elevator: Elevator, call: HallCall): number {
    const current = elevator.getCurrentFloor();
    const distance = Math.abs(current - call.floor);
    const direction = elevator.getDirection();

    if (direction === Direction.IDLE) {
      return distance;
    }

    const isMovingTowardSameDirection =
      (direction === Direction.UP &&
        call.direction === Direction.UP &&
        call.floor >= current) ||
      (direction === Direction.DOWN &&
        call.direction === Direction.DOWN &&
        call.floor <= current);

    if (isMovingTowardSameDirection) {
      return distance;
    }

    // Heuristic: If we can't serve it on the current pass, we have to 
    // go to our furthest stop, turn around, and come back.
    const allStops = [
      ...Array.from(elevator.getUpRequests()),
      ...Array.from(elevator.getDownRequests())
    ];
    
    let furthestStop = current;
    if (allStops.length > 0) {
      furthestStop = direction === Direction.UP 
        ? Math.max(...allStops)
        : Math.min(...allStops);
    }
    
    const travelToTurnAround = Math.abs(furthestStop - current);
    const travelToCall = Math.abs(furthestStop - call.floor);
    
    // If the call requires another full turn-around (e.g. going UP, call is UP but behind us),
    // add an extra penalty (simulating a trip back down to the lowest floor).
    const needsSecondTurn = 
      (direction === Direction.UP && call.direction === Direction.UP && call.floor < current) ||
      (direction === Direction.DOWN && call.direction === Direction.DOWN && call.floor > current);

    return travelToTurnAround + travelToCall + (needsSecondTurn ? 10 : 0);
  }
}
