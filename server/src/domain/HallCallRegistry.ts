import { Direction } from './Direction';
import { Elevator } from './Elevator';

export interface HallCallDTO {
  floor: number;
  direction: Direction.UP | Direction.DOWN;
}

interface PendingCall extends HallCallDTO {
  elevatorId: number;
}

function keyOf(floor: number, direction: Direction.UP | Direction.DOWN): string {
  return `${floor}:${direction}`;
}

/**
 * Tracks which hall-call buttons are currently "lit" (pressed but not yet
 * served), purely so the UI can keep a button highlighted until the
 * assigned elevator actually opens its door there. This is presentation
 * bookkeeping - it doesn't affect scheduling, which still lives in the
 * Elevator's own up/down request sets.
 */
export class HallCallRegistry {
  private readonly pending = new Map<string, PendingCall>();

  isPending(floor: number, direction: Direction.UP | Direction.DOWN): boolean {
    return this.pending.has(keyOf(floor, direction));
  }

  register(floor: number, direction: Direction.UP | Direction.DOWN, elevatorId: number): void {
    this.pending.set(keyOf(floor, direction), { floor, direction, elevatorId });
  }

  /** Clears and returns any hall calls at the car's current floor that the elevator has served. */
  clearServedCalls(elevator: Elevator): HallCallDTO[] {
    const cleared: HallCallDTO[] = [];
    const floor = elevator.getCurrentFloor();
    
    for (const [key, call] of this.pending.entries()) {
      if (call.elevatorId === elevator.id && call.floor === floor) {
        const stillPendingInElevator = 
          (call.direction === Direction.UP && elevator.getUpRequests().has(floor)) ||
          (call.direction === Direction.DOWN && elevator.getDownRequests().has(floor));
          
        if (!stillPendingInElevator) {
          this.pending.delete(key);
          cleared.push({ floor: call.floor, direction: call.direction });
        }
      }
    }
    return cleared;
  }

  snapshot(): HallCallDTO[] {
    return Array.from(this.pending.values()).map(({ floor, direction }) => ({ floor, direction }));
  }
}
