require('dotenv').config();
const http = require('http');
const app = require('./app');
const realtime = require('./realtime');

const port = Number(process.env.PORT || 4000);
const server = http.createServer(app);
realtime.attach(server, (process.env.CLIENT_ORIGIN || '').split(',').map((s) => s.trim()).filter(Boolean));
server.listen(port, () => {
  console.log(`API + Socket.IO listening on http://localhost:${port}`);
});
