import { Server, Socket } from 'socket.io';
import { ElevatorSystem } from '../domain/ElevatorSystem';
import { Direction } from '../domain/Direction';
import { HallCallDTO } from '../domain/HallCallRegistry';
import { CarCall } from '../domain/requests/CarCall';
import { FLOORS, ELEVATOR_COUNT, TICK_MS, DOOR_DWELL_TICKS } from '../config';

interface HallCallPayload {
  floor: number;
  direction: Direction;
}

interface DoorPayload {
  elevatorId: number;
}

/** Thin adapter translating Socket.io events into ElevatorSystem calls. */
export class ElevatorGateway {
  constructor(private readonly io: Server, private readonly system: ElevatorSystem) {
    this.io.on('connection', (socket) => this.handleConnection(socket));

    // Fleet-wide events, broadcast to every connected client so hall-call
    // buttons stay in sync across all viewers, not just the one who pressed.
    this.system.on('hallCall:registered', (call: HallCallDTO) => {
      this.io.emit('hall:pending', call);
    });
    this.system.on('hallCall:cleared', (call: HallCallDTO) => {
      this.io.emit('hall:cleared', call);
    });
  }

  private handleConnection(socket: Socket): void {
    socket.emit('elevator:init', {
      floors: FLOORS,
      elevatorCount: ELEVATOR_COUNT,
      tickMs: TICK_MS,
      doorDwellTicks: DOOR_DWELL_TICKS,
      elevators: this.system.snapshot(),
      pendingHallCalls: this.system.pendingHallCalls(),
    });

    socket.on('hall:call', (payload: HallCallPayload) => {
      this.safely(() =>
        this.system.requestHallCall(payload.floor, payload.direction as Direction.UP | Direction.DOWN)
      );
    });

    socket.on('car:call', (payload: CarCall) => {
      this.safely(() => this.system.requestCarCall(payload.elevatorId, payload.floor));
    });

    socket.on('door:hold', (payload: DoorPayload) => {
      this.safely(() => this.system.holdDoor(payload.elevatorId));
    });

    socket.on('door:close', (payload: DoorPayload) => {
      this.safely(() => this.system.closeDoor(payload.elevatorId));
    });
  }

  private safely(fn: () => void): void {
    try {
      fn();
    } catch (err) {
      console.error('[ElevatorGateway]', (err as Error).message);
    }
  }
}
