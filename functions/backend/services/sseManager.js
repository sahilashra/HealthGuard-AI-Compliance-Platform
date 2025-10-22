// services/sseManager.js
// Server-Sent Events (SSE) manager for real-time updates

const SseChannel = require('sse-channel');

// Store active SSE channels by job ID
const activeChannels = new Map();

/**
 * Create a new SSE channel for a job
 * @param {string} jobId - Unique job identifier
 * @returns {Object} SSE channel instance
 */
function createChannel(jobId) {
  console.log(`Creating SSE channel for job: ${jobId}`);

  const channel = new SseChannel({
    retryTimeout: 250,
    historySize: 100,
    pingInterval: 15000, // Send ping every 15 seconds to keep connection alive
    jsonEncode: true,
    cors: {
      origins: ['*'] // Allow all origins for hackathon demo
    }
  });

  // Store channel
  activeChannels.set(jobId, channel);

  // Clean up when all clients disconnect
  channel.on('disconnect', (client) => {
    console.log(`Client disconnected from job ${jobId}`);

    // If no more clients, remove channel after 5 minutes
    setTimeout(() => {
      if (channel.getConnectionCount() === 0) {
        console.log(`Removing inactive channel for job ${jobId}`);
        activeChannels.delete(jobId);
      }
    }, 5 * 60 * 1000); // 5 minutes
  });

  return channel;
}

/**
 * Get an existing SSE channel
 * @param {string} jobId - Job identifier
 * @returns {Object|null} SSE channel instance or null
 */
function getChannel(jobId) {
  return activeChannels.get(jobId) || null;
}

/**
 * Send an update to all clients connected to a job
 * @param {string} jobId - Job identifier
 * @param {Object} data - Data to send
 * @param {string} event - Event name (default: 'update')
 */
function sendUpdate(jobId, data, event = 'update') {
  const channel = activeChannels.get(jobId);

  if (!channel) {
    console.warn(`No active channel found for job ${jobId}`);
    return;
  }

  const clientCount = channel.getConnectionCount();
  console.log(`Sending SSE update to ${clientCount} client(s) for job ${jobId}:`, data.status || data.message || 'update');

  channel.send({
    event: event,
    data: data
  });
}

/**
 * Close a channel and disconnect all clients
 * @param {string} jobId - Job identifier
 */
function closeChannel(jobId) {
  const channel = activeChannels.get(jobId);

  if (!channel) {
    return;
  }

  console.log(`Closing SSE channel for job ${jobId}`);

  // Send final event
  channel.send({
    event: 'close',
    data: { message: 'Stream closed' }
  });

  // Remove from active channels
  activeChannels.delete(jobId);
}

/**
 * Get count of active channels
 * @returns {number} Number of active channels
 */
function getActiveChannelCount() {
  return activeChannels.size;
}

/**
 * Get total connected clients across all channels
 * @returns {number} Total connected clients
 */
function getTotalClientCount() {
  let total = 0;
  activeChannels.forEach(channel => {
    total += channel.getConnectionCount();
  });
  return total;
}

/**
 * Clean up inactive channels (older than 1 hour)
 */
function cleanupInactiveChannels() {
  const oneHourAgo = Date.now() - (60 * 60 * 1000);

  activeChannels.forEach((channel, jobId) => {
    if (channel.getConnectionCount() === 0) {
      console.log(`Removing inactive channel: ${jobId}`);
      activeChannels.delete(jobId);
    }
  });
}

// Run cleanup every 10 minutes
setInterval(cleanupInactiveChannels, 10 * 60 * 1000);

/**
 * SSE middleware for Express routes
 * @param {string} jobId - Job identifier
 * @returns {Function} Express middleware function
 */
function sseMiddleware(jobId) {
  let channel = getChannel(jobId);

  if (!channel) {
    channel = createChannel(jobId);
  }

  return (req, res, next) => {
    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable buffering for nginx

    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    console.log(`SSE client connected for job ${jobId}`);

    // Add client to channel
    channel.addClient(req, res);

    // Send initial connection success message
    sendUpdate(jobId, {
      status: 'connected',
      message: 'SSE connection established',
      jobId: jobId,
      timestamp: new Date().toISOString()
    });

    // Handle client disconnect
    req.on('close', () => {
      console.log(`SSE client disconnected from job ${jobId}`);
    });
  };
}

/**
 * Create a simple SSE stream helper
 * @param {Object} res - Express response object
 * @returns {Object} SSE stream helper
 */
function createSimpleStream(res) {
  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.setHeader('Access-Control-Allow-Origin', '*');

  // Flush headers
  res.flushHeaders();

  const send = (data, event = 'update') => {
    const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    res.write(message);
  };

  const close = () => {
    res.end();
  };

  return { send, close };
}

module.exports = {
  createChannel,
  getChannel,
  sendUpdate,
  closeChannel,
  getActiveChannelCount,
  getTotalClientCount,
  sseMiddleware,
  createSimpleStream
};
