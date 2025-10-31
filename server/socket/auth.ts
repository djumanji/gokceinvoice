import { Socket } from 'socket.io';
import { ExtendedError } from 'socket.io/dist/namespace';

/**
 * Socket.IO authentication middleware
 * Verifies user session and attaches userId to socket.data
 */
export function authenticateSocket(socket: Socket, next: (err?: ExtendedError) => void) {
  // Get session from socket handshake
  const req = socket.request as any;

  // Check if session exists
  if (!req.session) {
    console.log('[Socket.IO] Authentication failed: No session object');
    return next(new Error('Authentication required'));
  }

  // Check for userId in session (from our session-based auth)
  const userId = req.session.userId;

  if (!userId) {
    console.log('[Socket.IO] Authentication failed: No userId in session');
    return next(new Error('Authentication required'));
  }

  // Attach userId to socket data
  socket.data.userId = userId;
  console.log(`[Socket.IO] Authenticated user: ${socket.data.userId}`);

  next();
}
