import { Server as SocketIOServer } from 'socket.io';

let ioInstance: SocketIOServer | null = null;

export function initSocketIO(io: SocketIOServer) {
  ioInstance = io;

  io.on('connection', (socket) => {
    // console.log(`Socket connected: ${socket.id}`);

    socket.on('join_user', (userId: string) => {
      socket.join(`user:${userId}`);
    });

    socket.on('join_project', (projectId: string) => {
      socket.join(`project:${projectId}`);
    });

    socket.on('join_conversation', (conversationId: string) => {
      socket.join(`conversation:${conversationId}`);
    });

    socket.on('disconnect', () => {
      // console.log(`Socket disconnected: ${socket.id}`);
    });
  });
}

export function getIO(): SocketIOServer | null {
  return ioInstance;
}
