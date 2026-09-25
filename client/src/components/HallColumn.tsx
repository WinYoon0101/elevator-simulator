interface HallColumnProps {
  floors: number;
  onCall: (floor: number, direction: 'UP' | 'DOWN') => void;
  isPending: (floor: number, direction: 'UP' | 'DOWN') => boolean;
}

/**
 * Left-hand column: one row per floor, with UP/DOWN hall-call buttons.
 * A button lights up the moment it's pressed and stays lit until the
 * assigned elevator actually opens its door at that floor.
 */
export function HallColumn({ floors, onCall, isPending }: HallColumnProps) {
  const floorList = Array.from({ length: floors }, (_, i) => floors - i);

  return (
    <div className="hall-column">
      {floorList.map((floor) => (
        <div className="hall-row" key={floor}>
          <span className="floor-label">{floor}</span>
          <div className="hall-buttons">
            {floor < floors && (
              <button
                className={`hall-btn up ${isPending(floor, 'UP') ? 'pending' : ''}`}
                aria-label={`Call elevator up from floor ${floor}`}
                aria-pressed={isPending(floor, 'UP')}
                onClick={() => onCall(floor, 'UP')}
              >
                ▲
              </button>
            )}
            {floor > 1 && (
              <button
                className={`hall-btn down ${isPending(floor, 'DOWN') ? 'pending' : ''}`}
                aria-label={`Call elevator down from floor ${floor}`}
                aria-pressed={isPending(floor, 'DOWN')}
                onClick={() => onCall(floor, 'DOWN')}
              >
                ▼
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
