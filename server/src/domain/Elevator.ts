import { Direction } from './Direction';
import { DoorStatus } from './DoorStatus';
import { ElevatorState } from './states/ElevatorState';
import { IdleState } from './states/IdleState';
import { ElevatorObserver } from './ElevatorObserver';
import { DOOR_DWELL_TICKS } from '../config';

export interface ElevatorDTO {
  id: number;
  currentFloor: number;
  direction: Direction;
  doorStatus: DoorStatus;
  doorTicksRemaining: number;
  upStops: number[];
  downStops: number[];
}

export class Elevator {
  readonly id: number;

  private currentFloor: number;
  private state: ElevatorState;
  private doorStatus: DoorStatus = DoorStatus.CLOSED;
  private doorTicksRemaining = 0;

  private readonly upRequests = new Set<number>();
  private readonly downRequests = new Set<number>();
  private readonly observers: ElevatorObserver[] = [];

  constructor(id: number, startFloor = 1) {
    this.id = id;
    this.currentFloor = startFloor;
    this.state = new IdleState();
  }

  // ---- Observer plumbing -------------------------------------------------
  addObserver(observer: ElevatorObserver): void {
    this.observers.push(observer);
  }

  notifyObservers(): void {
    for (const observer of this.observers) observer.update(this);
  }

  // ---- Encapsulated state access (used by the State classes) ------------
  getCurrentFloor(): number {
    return this.currentFloor;
  }

  setCurrentFloor(floor: number): void {
    this.currentFloor = floor;
  }

  getDirection(): Direction {
    return this.state.getDirection();
  }

  getState(): ElevatorState {
    return this.state;
  }

  setState(state: ElevatorState): void {
    this.state = state;
  }

  getDoorStatus(): DoorStatus {
    return this.doorStatus;
  }

  isDoorOpen(): boolean {
    return this.doorStatus === DoorStatus.OPEN;
  }

  getDoorTicksRemaining(): number {
    return this.doorTicksRemaining;
  }

  getUpRequests(): Set<number> {
    return this.upRequests;
  }

  getDownRequests(): Set<number> {
    return this.downRequests;
  }

  // ---- Public API used by ElevatorSystem ---------------------------------
  addRequest(floor: number, direction: Direction | null): void {
    // Only short-circuit to an immediate door-open when the car is genuinely
    // parked at this floor. If it's mid-transit (state !== IDLE), the exact
    // floor can coincide with a call that must still respect direction -
    // e.g. pressing DOWN at floor 5 while the car passes through 5 on its
    // way up must NOT stop it there. Delegate to the state in that case.
    if (this.state.getDirection() === Direction.IDLE && floor === this.currentFloor && !this.isDoorOpen()) {
      this.openDoorAt(floor);
    } else {
      this.state.addRequest(this, floor, direction);
    }
    this.notifyObservers();
  }

  openDoorAt(floor: number): void {
    this.currentFloor = floor;
    this.doorStatus = DoorStatus.OPEN;
    this.doorTicksRemaining = DOOR_DWELL_TICKS;
  }

  holdDoor(): void {
    if (this.doorStatus === DoorStatus.OPEN) {
      this.doorTicksRemaining = DOOR_DWELL_TICKS;
      this.notifyObservers();
    }
  }

  closeDoorNow(): void {
    if (this.doorStatus === DoorStatus.OPEN) {
      this.doorStatus = DoorStatus.CLOSED;
      this.doorTicksRemaining = 0;
      this.notifyObservers();
    }
  }

  /** Advances the simulation by one tick: door dwell, or one floor of travel. */
  step(): void {
    if (this.doorStatus === DoorStatus.OPEN) {
      this.doorTicksRemaining -= 1;
      if (this.doorTicksRemaining <= 0) {
        this.doorStatus = DoorStatus.CLOSED;
      }
      // Notify on every dwell tick, not just the one that closes the door -
      // otherwise the client never sees the countdown in between and the
      // progress bar appears frozen until it suddenly jumps to empty.
      this.notifyObservers();
      return;
    }

    this.state.move(this);
    this.notifyObservers();
  }

  toDTO(): ElevatorDTO {
    return {
      id: this.id,
      currentFloor: this.currentFloor,
      direction: this.state.getDirection(),
      doorStatus: this.doorStatus,
      doorTicksRemaining: this.doorTicksRemaining,
      upStops: Array.from(this.upRequests).sort((a, b) => a - b),
      downStops: Array.from(this.downRequests).sort((a, b) => a - b),
    };
  }
}
