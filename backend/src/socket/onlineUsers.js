// Map<userId, Set<socketId>> to handle multiple connections per user
let onlineUsersMap = new Map();

export const registerOnlineUsersHandler = (io, socket) => {
  const userId = socket.userId.toString();

  // Add socket to the user's set of connections
  if (!onlineUsersMap.has(userId)) {
    onlineUsersMap.set(userId, new Set());
  }
  onlineUsersMap.get(userId).add(socket.id);

  // Broadcast the list of unique online user IDs
  io.emit("onlineUsers", Array.from(onlineUsersMap.keys()));

  socket.on("disconnect", () => {
    if (onlineUsersMap.has(userId)) {
      const connections = onlineUsersMap.get(userId);
      connections.delete(socket.id);

      // If no connections left for this user, remove them from the map
      if (connections.size === 0) {
        onlineUsersMap.delete(userId);
      }

      // Broadcast the updated list
      io.emit("onlineUsers", Array.from(onlineUsersMap.keys()));
    }
  });
};
