import { Elevator } from '../Elevator';
import { HallCall } from '../requests/HallCall';

/**
 * Strategy pattern: swap in a different allocation algorithm
 * (e.g. LeastBusyStrategy, ZoneBasedStrategy) without touching
 * ElevatorSystem or the state machine.
 */
export interface ElevatorSelectionStrategy {
  selectElevator(elevators: Elevator[], call: HallCall): Elevator;
}
