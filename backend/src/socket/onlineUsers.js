let onlineUsers = new Map();
export const registerOnlineUsersHandler = (io, socket) => {
  const userId = socket.userId.toString();

  //add user to online users set
  onlineUsers.set(userId, socket.id);
  io.emit("onlineUsers", [...onlineUsers.keys()]);
  //remove user from online users set when user disconnects
  socket.on("disconnect", () => {
    onlineUsers.delete(userId);
    io.emit("onlineUsers", [...onlineUsers.keys()]);
  });
};
