import { Server } from 'socket.io';
import { Elevator } from '../domain/Elevator';
import { ElevatorObserver } from '../domain/ElevatorObserver';

/** Concrete Observer: pushes every state change out to all connected clients. */
export class SocketBroadcaster implements ElevatorObserver {
  constructor(private readonly io: Server) {}

  update(elevator: Elevator): void {
    this.io.emit('elevator:update', elevator.toDTO());
  }
}
