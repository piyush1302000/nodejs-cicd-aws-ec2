const createApp = require('./app');

const port = process.env.PORT || 3000;
const server = createApp();

server.listen(port, '0.0.0.0', () => {
  console.log(`Listening on port ${port}`);
});

// systemd sends SIGTERM when the service is stopped or restarted
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down');
  server.close(() => process.exit(0));
});
