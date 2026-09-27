# Elevator Simulator

A real-time elevator simulator built with Node.js, TypeScript, and React. 
It simulates 3 elevators across 10 floors, using Socket.io to sync the simulation state with the frontend in real time.

## Tech Stack

- **Backend:** Node.js, TypeScript, Express, Socket.io
- **Frontend:** React, TypeScript, Vite
- **Architecture:** OOP Design Patterns (State, Strategy, Observer, Singleton)

## Getting Started

You'll need two terminal sessions to run both the server and the client.

### 1. Start the Server
```bash
cd server
npm install
npm run dev
```
The backend will start on `http://localhost:4000`.

### 2. Start the Client
```bash
cd client
npm install
npm run dev
```
The frontend will start on `http://localhost:5173`.

> **Note:** The client defaults to `http://localhost:4000` for the WebSocket connection. If you need to change this, add a `.env` file in the `client/` directory with `VITE_SERVER_URL=http://your-host:4000`.

## System Design

The core logic lives in the backend (`server/src/domain/`) and relies on standard OOP patterns to handle complex state transitions:

- **State Pattern:** Governs elevator movement (`IdleState`, `MovingUpState`, `MovingDownState`). This ensures elevators follow realistic rules (e.g., a car moving UP will only stop for UP calls on its way, queuing DOWN calls for the return trip).
- **Strategy Pattern:** `NearestElevatorStrategy` is used to decide which car should respond to a hall call. It calculates a score based on distance and current direction.
- **Observer Pattern:** Any change in an elevator's state triggers an event that `SocketBroadcaster` pushes to all connected web clients. No polling required.
- **Singleton:** The `ElevatorSystem` manages the global simulation tick loop and the elevator fleet.

## Socket Events

### Client -> Server
| Event | Payload | Description |
|---|---|---|
| `hall:call` | `{ floor, direction: 'UP' \| 'DOWN' }` | User presses a call button in the hallway. |
| `car:call` | `{ elevatorId, floor }` | User selects a destination floor inside the elevator. |
| `door:hold` | `{ elevatorId }` | Keeps the door open longer. |
| `door:close` | `{ elevatorId }` | Forces the door to close immediately. |

### Server -> Client
| Event | Payload | Description |
|---|---|---|
| `elevator:init` | `{ floors, elevatorCount, elevators }` | Syncs initial state when a client first connects. |
| `elevator:update`| `ElevatorDTO` | Pushed on every state change (floor reached, doors opened, etc.). |


