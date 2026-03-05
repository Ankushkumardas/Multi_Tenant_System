export const registerTypingHandler = (io, socket) => {
  socket.on("typing", (data) => {
    const { chatRoomId } = data;
    io.to(chatRoomId).emit("typing", {
      chatRoomId,
      userId: socket.userId.toString(),
    });
  });
  socket.on("stopTyping", (data) => {
    const { chatRoomId } = data;
    io.to(chatRoomId).emit("stopTyping", {
      chatRoomId,
      userId: socket.userId.toString(),
    });
  });
};
