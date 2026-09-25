# Elevator Simulator (Node.js + TypeScript + React)

3 elevators, 10 floors, real-time hall/car calls over Socket.io, built with
OOP design patterns (State, Strategy, Observer, Singleton).

## Structure

```
server/   Node.js + TypeScript + Express + Socket.io backend
client/   React + TypeScript (Vite) frontend
```

## Running it

```bash
# terminal 1
cd server
npm install
npm run dev        # http://localhost:4000

# terminal 2
cd client
npm install
npm run dev         # http://localhost:5173
```

The client connects to `http://localhost:4000` by default. Override with a
`.env` file in `client/` containing `VITE_SERVER_URL=http://your-host:4000`.

## Design overview

**State pattern** (`server/src/domain/states/`)
`ElevatorState` (`IdleState` / `MovingUpState` / `MovingDownState`) governs
both how a new request is filed and how a single simulation tick moves the
car. This is what implements the spec's rule: *a car moving up only stops
for UP calls in its path; a DOWN call placed above it is queued and served
after the car reaches the top of its run and reverses* — the exact "floor 5"
example in the brief.

**Strategy pattern** (`server/src/domain/strategies/`)
`ElevatorSelectionStrategy` decides which car answers a hall call.
`NearestElevatorStrategy` scores idle cars and cars already heading toward
the call in the same direction by distance, and penalizes everything else.
Swap in a different strategy without touching `ElevatorSystem` or the state
machine.

**Observer pattern** (`server/src/domain/ElevatorObserver.ts`)
Every state change (`Elevator.notifyObservers()`) is pushed to
`SocketBroadcaster`, which emits `elevator:update` to every connected React
client — no polling.

**Singleton** (`server/src/domain/ElevatorSystem.ts`)
`ElevatorSystem.getInstance()` owns the fleet and the simulation clock
(`setInterval` ticking every `TICK_MS`), and is the single entry point the
Socket.io gateway calls into.

**Encapsulation**
`Elevator` keeps `currentFloor`, `doorStatus`, and the up/down request sets
private, exposing only the methods the state classes and system need
(`getCurrentFloor`, `openDoorAt`, `getUpRequests`, ...).

## Socket.io protocol

| Event (client → server) | Payload | Meaning |
|---|---|---|
| `hall:call` | `{ floor, direction: 'UP' \| 'DOWN' }` | Hallway button press |
| `car:call` | `{ elevatorId, floor }` | Destination button inside a car |
| `door:hold` | `{ elevatorId }` | Hold-door button |
| `door:close` | `{ elevatorId }` | Close-door-now button |

| Event (server → client) | Payload |
|---|---|
| `elevator:init` | `{ floors, elevatorCount, elevators: ElevatorDTO[] }` (sent once on connect) |
| `elevator:update` | `ElevatorDTO` (sent on every state change for one car) |

## Notable trade-offs / what's simplified

- The scheduling algorithm is a classic SCAN/LOOK, not a full cost-based
  optimizer — good enough for 3 cars / 10 floors and easy to reason about
  and test.
- No persistence: state lives in memory in the singleton `ElevatorSystem`;
  a server restart resets all cars to floor 1.
- No automated test suite is included; the state/strategy classes are pure
  and side-effect-free (aside from mutating the passed-in `Elevator`), so
  they're straightforward to unit test with e.g. Jest — happy to add that
  if useful.
