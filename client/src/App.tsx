import { useEffect, useState } from 'react';
import { socket } from './socket';
import { ElevatorDTO, HallCallDTO, InitPayload } from './types';
import { HallColumn } from './components/HallColumn';
import { ShaftColumn } from './components/ShaftColumn';
import { CarPanel } from './components/CarPanel';
import './App.css';

function hallKey(floor: number, direction: 'UP' | 'DOWN'): string {
  return `${floor}:${direction}`;
}

function App() {
  const [connected, setConnected] = useState(false);
  const [floors, setFloors] = useState(10);
  const [tickMs, setTickMs] = useState(900);
  const [doorDwellTicks, setDoorDwellTicks] = useState(3);
  const [elevators, setElevators] = useState<ElevatorDTO[]>([]);
  const [pendingHalls, setPendingHalls] = useState<Set<string>>(new Set());

  useEffect(() => {
    const handleConnect = () => setConnected(true);
    const handleDisconnect = () => setConnected(false);

    const handleInit = (payload: InitPayload) => {
      setFloors(payload.floors);
      setTickMs(payload.tickMs);
      setDoorDwellTicks(payload.doorDwellTicks);
      setElevators(payload.elevators);
      setPendingHalls(new Set(payload.pendingHallCalls.map((c) => hallKey(c.floor, c.direction))));
    };

    const handleUpdate = (updated: ElevatorDTO) => {
      setElevators((prev) => {
        const next = [...prev];
        const idx = next.findIndex((e) => e.id === updated.id);
        if (idx >= 0) {
          next[idx] = updated;
        } else {
          next.push(updated);
        }
        return next;
      });
    };

    const handleHallPending = (call: HallCallDTO) => {
      setPendingHalls((prev) => new Set(prev).add(hallKey(call.floor, call.direction)));
    };

    const handleHallCleared = (call: HallCallDTO) => {
      setPendingHalls((prev) => {
        const next = new Set(prev);
        next.delete(hallKey(call.floor, call.direction));
        return next;
      });
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('elevator:init', handleInit);
    socket.on('elevator:update', handleUpdate);
    socket.on('hall:pending', handleHallPending);
    socket.on('hall:cleared', handleHallCleared);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('elevator:init', handleInit);
      socket.off('elevator:update', handleUpdate);
      socket.off('hall:pending', handleHallPending);
      socket.off('hall:cleared', handleHallCleared);
    };
  }, []);

  const callHall = (floor: number, direction: 'UP' | 'DOWN') => {
    // Optimistic UI: light the button immediately instead of waiting on the
    // round trip, the server broadcast will just confirm/no-op on arrival.
    setPendingHalls((prev) => new Set(prev).add(hallKey(floor, direction)));
    socket.emit('hall:call', { floor, direction });
  };

  const selectFloor = (elevatorId: number, floor: number) => {
    socket.emit('car:call', { elevatorId, floor });
  };

  const holdDoor = (elevatorId: number) => socket.emit('door:hold', { elevatorId });
  const closeDoor = (elevatorId: number) => socket.emit('door:close', { elevatorId });

  const isHallPending = (floor: number, direction: 'UP' | 'DOWN') =>
    pendingHalls.has(hallKey(floor, direction));

  return (
    <div className="app">
      <header className="app-header">
        <h1>Elevator Simulator</h1>
        <span className={`status-pill ${connected ? 'ok' : 'down'}`}>
          {connected ? 'connected' : 'disconnected'}
        </span>
      </header>

      <div className="building">
        <HallColumn floors={floors} onCall={callHall} isPending={isHallPending} />
        {elevators.map((elevator) => (
          <ShaftColumn key={elevator.id} floors={floors} elevator={elevator} tickMs={tickMs} />
        ))}
      </div>

      <div className="panels">
        {elevators.map((elevator) => (
          <CarPanel
            key={elevator.id}
            floors={floors}
            elevator={elevator}
            doorDwellTicks={doorDwellTicks}
            tickMs={tickMs}
            onSelectFloor={selectFloor}
            onHoldDoor={holdDoor}
            onCloseDoor={closeDoor}
          />
        ))}
      </div>
    </div>
  );
}

export default App;
