import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { ElevatorSystem } from './domain/ElevatorSystem';
import { SocketBroadcaster } from './gateway/SocketBroadcaster';
import { ElevatorGateway } from './gateway/ElevatorGateway';

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

const system = ElevatorSystem.getInstance();
system.addObserver(new SocketBroadcaster(io));
new ElevatorGateway(io, system);
system.start();

app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.get('/state', (_req, res) => res.json(system.snapshot()));

const PORT = Number(process.env.PORT) || 4000;
server.listen(PORT, () => {
  console.log(`Elevator server listening on http://localhost:${PORT}`);
});

process.on('SIGINT', () => {
  system.shutdown();
  server.close(() => process.exit(0));
});
