import { Response } from 'express';

export interface BusinessEvent {
  type: string;
  payload: any;
  timestamp: string;
}

export class RealtimeService {
  private static clients: Response[] = [];

  static subscribe(res: Response) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    this.clients.push(res);
    console.log(`[Realtime SSE] Client connected. Total active listeners: ${this.clients.length}`);

    // Send initial handshake
    res.write(`data: ${JSON.stringify({ type: 'CONNECTED', timestamp: new Date().toISOString() })}\n\n`);

    res.on('close', () => {
      this.clients = this.clients.filter(c => c !== res);
      console.log(`[Realtime SSE] Client disconnected. Total active listeners: ${this.clients.length}`);
    });
  }

  static broadcast(type: string, payload: any) {
    const event: BusinessEvent = {
      type,
      payload,
      timestamp: new Date().toISOString()
    };

    const message = `data: ${JSON.stringify(event)}\n\n`;
    for (const client of this.clients) {
      try {
        client.write(message);
      } catch (e) {
        // Handle dead client socket
      }
    }
  }
}

