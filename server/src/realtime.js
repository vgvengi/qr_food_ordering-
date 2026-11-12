const { Server } = require('socket.io');

// Rooms: "kitchen" gets every order event; "order:<id>" gets updates for one customer's order.
let io = null;

function attach(httpServer, origin) {
  io = new Server(httpServer, { cors: { origin } });
  io.on('connection', (socket) => {
    socket.on('join:kitchen', () => socket.join('kitchen'));
    socket.on('join:order', (id) => {
      if (Number.isInteger(Number(id))) socket.join(`order:${Number(id)}`);
    });
  });
  return io;
}

function emitOrder(order) {
  if (!io || !order) return;
  io.to('kitchen').to(`order:${order.id}`).emit('order:updated', order);
}

module.exports = { attach, emitOrder };
