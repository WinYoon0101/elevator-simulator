export type Direction = 'UP' | 'DOWN' | 'IDLE';
export type DoorStatus = 'OPEN' | 'CLOSED';

export interface ElevatorDTO {
  id: number;
  currentFloor: number;
  direction: Direction;
  doorStatus: DoorStatus;
  doorTicksRemaining: number;
  upStops: number[];
  downStops: number[];
}

export interface HallCallDTO {
  floor: number;
  direction: 'UP' | 'DOWN';
}

export interface InitPayload {
  floors: number;
  elevatorCount: number;
  tickMs: number;
  doorDwellTicks: number;
  elevators: ElevatorDTO[];
  pendingHallCalls: HallCallDTO[];
}
