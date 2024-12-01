import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import { v4 as uuidv4 } from 'uuid';

interface Client extends WebSocket {
  id: string;
  isAlive: boolean;
}

class WebSocketService {
  private wss: WebSocketServer;
  private clients: Set<Client> = new Set();

  constructor(server: any) {
    this.wss = new WebSocketServer({ server, path: '/ws' });
    this.setupEventHandlers();
    this.setupPingPong();
  }

  private setupEventHandlers() {
    this.wss.on('connection', (ws: Client, req: IncomingMessage) => {
      // Generate a unique ID for the client
      ws.id = uuidv4();
      ws.isAlive = true;
      this.clients.add(ws);

      console.log(`New WebSocket connection (${ws.id}). Total clients: ${this.clients.size}`);

      ws.on('pong', () => {
        (ws as Client).isAlive = true;
      });

      ws.on('close', () => {
        this.clients.delete(ws);
        console.log(`Client disconnected (${ws.id}). Remaining clients: ${this.clients.size}`);
      });

      // Send a welcome message
      ws.send(JSON.stringify({
        type: 'connection_ack',
        clientId: ws.id,
        message: 'Connected to StratusWatch WebSocket server'
      }));
    });
  }

  // Broadcast a message to all connected clients
  public broadcast(data: any) {
    const message = typeof data === 'string' ? data : JSON.stringify(data);
    this.wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  // Send a message to a specific client
  public sendToClient(clientId: string, data: any) {
    const message = typeof data === 'string' ? data : JSON.stringify(data);
    this.wss.clients.forEach((client: WebSocket) => {
      const wsClient = client as Client;
      if (wsClient.id === clientId && wsClient.readyState === WebSocket.OPEN) {
        wsClient.send(message);
      }
    });
  }

  // Setup ping/pong to detect dead connections
  private setupPingPong() {
    const interval = setInterval(() => {
      this.wss.clients.forEach((ws: WebSocket) => {
        const client = ws as Client;
        if (!client.isAlive) {
          console.log(`Terminating dead connection (${client.id})`);
          client.terminate();
          this.clients.delete(client);
          return;
        }

        client.isAlive = false;
        client.ping();
      });
    }, 30000);

    this.wss.on('close', () => {
      clearInterval(interval);
    });
  }
}

export default WebSocketService;
