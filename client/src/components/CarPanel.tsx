import { useEffect, useState } from 'react';
import { ElevatorDTO } from '../types';

interface CarPanelProps {
  floors: number;
  elevator: ElevatorDTO;
  doorDwellTicks: number;
  /** Simulation tick length in ms - the progress bar's width transition is
   * set to match it, so the countdown drains continuously in step with the
   * server's real dwell ticks instead of jumping in visible chunks. */
  tickMs: number;
  onSelectFloor: (elevatorId: number, floor: number) => void;
  onHoldDoor: (elevatorId: number) => void;
  onCloseDoor: (elevatorId: number) => void;
}

/** Below-the-shaft control panel: destination buttons + door controls for one car. */
export function CarPanel({
  floors,
  elevator,
  doorDwellTicks,
  tickMs,
  onSelectFloor,
  onHoldDoor,
  onCloseDoor,
}: CarPanelProps) {
  const floorList = Array.from({ length: floors }, (_, i) => floors - i);
  const doorOpen = elevator.doorStatus === 'OPEN';

  // Brief visual "press" flash so a click registers instantly on screen,
  // even before the server round-trip confirms the door timer reset.
  const [holdFlash, setHoldFlash] = useState(false);
  const [closeFlash, setCloseFlash] = useState(false);

  useEffect(() => {
    if (!holdFlash) return;
    const t = setTimeout(() => setHoldFlash(false), 350);
    return () => clearTimeout(t);
  }, [holdFlash]);

  useEffect(() => {
    if (!closeFlash) return;
    const t = setTimeout(() => setCloseFlash(false), 350);
    return () => clearTimeout(t);
  }, [closeFlash]);

  const doorProgressPct = doorOpen
    ? Math.max(0, Math.min(100, (elevator.doorTicksRemaining / doorDwellTicks) * 100))
    : 0;

  const handleHold = () => {
    setHoldFlash(true);
    onHoldDoor(elevator.id);
  };

  const handleClose = () => {
    setCloseFlash(true);
    onCloseDoor(elevator.id);
  };

  return (
    <div className="car-panel">
      <div className="car-panel-header">
        <span>Car {elevator.id}</span>
        <span className="car-status">
          {elevator.direction} · {elevator.doorStatus}
        </span>
      </div>

      <div className="door-progress-track" aria-hidden={!doorOpen}>
        <div
          className="door-progress-fill"
          style={{ width: `${doorProgressPct}%`, transitionDuration: `${tickMs}ms` }}
        />
      </div>

      <div className="destination-grid">
        {floorList.map((floor) => {
          const isRequested =
            elevator.upStops.includes(floor) || elevator.downStops.includes(floor);
          return (
            <button
              key={floor}
              className={`dest-btn ${isRequested ? 'requested' : ''} ${
                elevator.currentFloor === floor ? 'current' : ''
              }`}
              onClick={() => onSelectFloor(elevator.id, floor)}
            >
              {floor}
            </button>
          );
        })}
      </div>

      <div className="door-controls">
        <button
          className={`door-btn ${holdFlash ? 'pressed' : ''}`}
          title="Hold door open"
          disabled={!doorOpen}
          onClick={handleHold}
        >
          ◄ ►
        </button>
        <button
          className={`door-btn ${closeFlash ? 'pressed' : ''}`}
          title="Close door now"
          disabled={!doorOpen}
          onClick={handleClose}
        >
          ► ◄
        </button>
      </div>
    </div>
  );
}
