import { io } from "socket.io-client";

const socket = io("http://localhost:5001", {
  transports: ["websocket"]
});

const conversationId = 1; // ⚠ Make sure conversation between user 6 & 7 exists
const userId = 1;
const receiverId = 2;

socket.on("connect", () => {
  console.log("✅ Connected to socket server");
  console.log("Socket ID:", socket.id);

  // Join conversation room
  socket.emit("join_conversation", {
    conversation_id: conversationId,
    user_id: userId
  });
});

socket.on("joined", (data) => {
  console.log("🟢 Joined conversation:", data);

  // Send a test message
  socket.emit("send_message", {
    conversation_id: conversationId,
    sender_id: userId,
    receiver_id: receiverId,
    content: "seem khdam"
  });
});

socket.on("new_message", (msg) => {
  console.log("📩 New message received:", msg);
});

socket.on("error", (err) => {
  console.error("❌ Socket error:", err);
});

socket.on("disconnect", () => {
  console.log("❌ Disconnected");
});
