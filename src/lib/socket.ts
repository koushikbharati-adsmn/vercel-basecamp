import { io } from "socket.io-client"

// App-wide Socket.IO transport, distinct from native coach WebSockets.
// Consumers remove their listeners on cleanup, rather than closing this socket.
export const socket = io(import.meta.env.VITE_API_SOCKET_URL, {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  transports: ["websocket", "polling"],
})

socket.on("connect", () => {
  console.log("[socket] connected:", socket.id)
})

socket.on("disconnect", (reason) => {
  console.log("[socket] disconnected:", reason)
})

socket.on("connect_error", (error) => {
  console.error("[socket] connect_error:", error)
})
