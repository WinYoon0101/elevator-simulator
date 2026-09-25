import { Direction } from '../Direction';

/** A call placed from a hallway button ("I'm on floor 5, going up"). */
export interface HallCall {
  floor: number;
  direction: Direction.UP | Direction.DOWN;
}
