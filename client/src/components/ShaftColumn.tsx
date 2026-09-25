import { ElevatorDTO } from '../types';
import { ROW_HEIGHT } from '../constants';

interface ShaftColumnProps {
  floors: number;
  elevator: ElevatorDTO;
  /** Simulation tick length in ms, used so the slide animation's speed
   * always matches how long a real floor-to-floor move actually takes. */
  tickMs: number;
}

/**
 * One vertical shaft. The car is a single absolutely-positioned element
 * whose `top` is driven by CSS transition - so instead of disappearing
 * from one row and reappearing in the next (the old "jumping" behaviour),
 * it glides continuously between floors.
 */
export function ShaftColumn({ floors, elevator, tickMs }: ShaftColumnProps) {
  const floorList = Array.from({ length: floors }, (_, i) => floors - i);
  const top = (floors - elevator.currentFloor) * ROW_HEIGHT;
  const doorOpen = elevator.doorStatus === 'OPEN';

  return (
    <div className="shaft-column" style={{ height: floors * ROW_HEIGHT }}>
      {floorList.map((floor) => (
        <div className="shaft-row" key={floor} style={{ height: ROW_HEIGHT }} />
      ))}

      <div
        className={`car ${doorOpen ? 'door-open' : ''}`}
        style={{ top, transitionDuration: `${tickMs}ms` }}
      >
        <div className="car-interior">
          <span className="car-id">{elevator.id}</span>
          {elevator.direction !== 'IDLE' && (
            <span className="car-direction">{elevator.direction === 'UP' ? '▲' : '▼'}</span>
          )}
        </div>
        {/* Two sliding panels: closed, they meet in the middle and cover
           the interior; open, they retract to the outer edges. */}
        <div className="door-panel left" />
        <div className="door-panel right" />
      </div>
    </div>
  );
}
