// server/index.js

// Import the http module to create an HTTP server
const http = require('http');
// Import the Server class from socket.io to enable WebSocket communication
const { Server } = require('socket.io');

// Define the port on which the server will listen
const PORT = process.env.PORT || 3000;

// Create an HTTP server
const httpServer = http.createServer();

// Initialize a new Socket.io server, attaching it to the HTTP server.
// The 'cors' option is crucial for allowing communication from different origins (your Electron apps).
const io = new Server(httpServer, {
  cors: {
    origin: "*", // Allow all origins for development. In production, specify your client origins.
    methods: ["GET", "POST"] // Allowed HTTP methods
  }
});

console.log(`Socket.io server starting on port ${PORT}...`);

// Store connected clients. We'll only expect one care-giver and one elder client for this POC.
// In a more complex scenario, you might use a map for multiple care-giver/elder pairs.
let careGiverSocketId = null;
let elderSocketId = null;

// Listen for new client connections
io.on('connection', (socket) => {
  console.log(`A client connected: ${socket.id}`);

  // Determine if the connected client is a care-giver or an elder based on custom events
  socket.on('register_caregiver', () => {
    careGiverSocketId = socket.id;
    console.log(`Care-giver registered: ${careGiverSocketId}`);
    // Notify all clients (including the newly connected elder if they connect later)
    // about the care-giver's connection status.
    io.emit('connection_status', { careGiverConnected: true, elderConnected: !!elderSocketId });
  });

  socket.on('register_elder', () => {
    elderSocketId = socket.id;
    console.log(`Elder registered: ${elderSocketId}`);
    // Notify all clients (including the newly connected care-giver if they connect later)
    // about the elder's connection status.
    io.emit('connection_status', { careGiverConnected: !!careGiverSocketId, elderConnected: true });
  });

  // Handle incoming 'video_url' events from the care-giver
  socket.on('video_url', (url) => {
    if (socket.id === careGiverSocketId) {
      console.log(`Received video URL from care-giver: ${url}`);
      // If an elder is connected, emit the URL to the elder client only
      if (elderSocketId) {
        io.to(elderSocketId).emit('play_video', url);
        console.log(`Sent video URL to elder: ${elderSocketId}`);
      } else {
        console.log('Elder not connected. Cannot send video URL.');
      }
    } else {
      console.log(`Received video URL from non-care-giver client: ${socket.id}`);
    }
  });

  // Handle incoming 'playback_command' events from the care-giver
  socket.on('playback_command', (command) => {
    if (socket.id === careGiverSocketId) {
      console.log(`Received playback command from care-giver: ${command}`);
      // If an elder is connected, emit the command to the elder client only
      if (elderSocketId) {
        io.to(elderSocketId).emit('execute_command', command);
        console.log(`Sent playback command to elder: ${elderSocketId}`);
      } else {
        console.log('Elder not connected. Cannot send playback command.');
      }
    } else {
      console.log(`Received playback command from non-care-giver client: ${socket.id}`);
    }
  });

  // Handle client disconnections
  socket.on('disconnect', () => {
    console.log(`A client disconnected: ${socket.id}`);
    if (socket.id === careGiverSocketId) {
      careGiverSocketId = null;
      console.log('Care-giver disconnected.');
    } else if (socket.id === elderSocketId) {
      elderSocketId = null;
      console.log('Elder disconnected.');
    }
    // Update connection status for remaining clients
    io.emit('connection_status', { careGiverConnected: !!careGiverSocketId, elderConnected: !!elderSocketId });
  });

  // Basic error handling for socket errors
  socket.on('error', (error) => {
    console.error(`Socket error for ${socket.id}:`, error);
  });
});

// Start the HTTP server, listening on the specified port
httpServer.listen(PORT, () => {
  console.log(`Socket.io server is listening on port ${PORT}`);
});

// Basic error handling for the HTTP server
httpServer.on('error', (error) => {
  console.error('HTTP server error:', error);
  process.exit(1); // Exit the process if the server encounters a critical error
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Server shutting down...');
  io.close(() => {
    httpServer.close(() => {
      console.log('Server closed.');
      process.exit(0);
    });
  });
});
