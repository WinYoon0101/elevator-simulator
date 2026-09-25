import { EventEmitter } from 'events';
import { Elevator, ElevatorDTO } from './Elevator';
import { Direction } from './Direction';
import { ElevatorSelectionStrategy } from './strategies/ElevatorSelectionStrategy';
import { NearestElevatorStrategy } from './strategies/NearestElevatorStrategy';
import { HallCall } from './requests/HallCall';
import { HallCallRegistry, HallCallDTO } from './HallCallRegistry';
import { ElevatorObserver } from './ElevatorObserver';
import { FLOORS, ELEVATOR_COUNT, TICK_MS } from '../config';

/**
 * Singleton facade the rest of the app talks to. Owns the fleet, runs the
 * simulation clock, delegates "which car should answer this call" to the
 * injected ElevatorSelectionStrategy, and tracks which hall-call buttons
 * are still pending so the UI can keep them lit until served.
 *
 * Emits ('hallCall:registered', HallCallDTO) when a new hall call starts
 * being tracked, and ('hallCall:cleared', HallCallDTO) when it's served.
 */
export class ElevatorSystem extends EventEmitter {
  private static instance: ElevatorSystem | null = null;

  readonly elevators: Elevator[];
  private strategy: ElevatorSelectionStrategy;
  private readonly hallCalls = new HallCallRegistry();
  private timer: NodeJS.Timeout | null = null;

  private constructor(strategy: ElevatorSelectionStrategy) {
    super();
    this.strategy = strategy;
    this.elevators = Array.from(
      { length: ELEVATOR_COUNT },
      (_, i) => new Elevator(i + 1, 1)
    );
  }

  static getInstance(strategy: ElevatorSelectionStrategy = new NearestElevatorStrategy()): ElevatorSystem {
    if (!ElevatorSystem.instance) {
      ElevatorSystem.instance = new ElevatorSystem(strategy);
    }
    return ElevatorSystem.instance;
  }

  /** Test-only helper to get a clean fleet between unit tests. */
  static resetForTests(): void {
    ElevatorSystem.instance = null;
  }

  setStrategy(strategy: ElevatorSelectionStrategy): void {
    this.strategy = strategy;
  }

  addObserver(observer: ElevatorObserver): void {
    for (const elevator of this.elevators) elevator.addObserver(observer);
  }

  start(): void {
    if (this.timer) return;
    this.timer = setInterval(() => {
      for (const elevator of this.elevators) {
        elevator.step();

        // A door that's open right now might just have opened at this
        // floor to serve a pending hall call - clear it so the UI can
        // un-highlight the button. Cheap to call every tick; a no-op once
        // the call has already been cleared.
        if (elevator.isDoorOpen()) {
          const cleared = this.hallCalls.clearServedCalls(elevator);
          for (const call of cleared) this.emit('hallCall:cleared', call);
        }
      }
    }, TICK_MS);
  }

  shutdown(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  requestHallCall(floor: number, direction: Direction.UP | Direction.DOWN): void {
    this.validateFloor(floor);

    if (this.hallCalls.isPending(floor, direction)) {
      // Already lit and assigned - a repeat press is a no-op.
      return;
    }

    const call: HallCall = { floor, direction };
    const chosen = this.strategy.selectElevator(this.elevators, call);
    this.hallCalls.register(floor, direction, chosen.id);
    this.emit('hallCall:registered', call);
    chosen.addRequest(floor, direction);
  }

  requestCarCall(elevatorId: number, floor: number): void {
    this.validateFloor(floor);
    const elevator = this.findElevator(elevatorId);
    elevator.addRequest(floor, null);
  }

  holdDoor(elevatorId: number): void {
    this.findElevator(elevatorId).holdDoor();
  }

  closeDoor(elevatorId: number): void {
    this.findElevator(elevatorId).closeDoorNow();
  }

  snapshot(): ElevatorDTO[] {
    return this.elevators.map((e) => e.toDTO());
  }

  pendingHallCalls(): HallCallDTO[] {
    return this.hallCalls.snapshot();
  }

  private findElevator(elevatorId: number): Elevator {
    const elevator = this.elevators.find((e) => e.id === elevatorId);
    if (!elevator) throw new Error(`Unknown elevator id ${elevatorId}`);
    return elevator;
  }

  private validateFloor(floor: number): void {
    if (!Number.isInteger(floor) || floor < 1 || floor > FLOORS) {
      throw new Error(`Floor ${floor} is out of range (1-${FLOORS})`);
    }
  }
}
