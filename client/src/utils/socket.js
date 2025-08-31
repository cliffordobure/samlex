import { io } from "socket.io-client";
import { SOCKET_URL } from "../config/api.js";

const socket = io(SOCKET_URL, {
  withCredentials: true,
  transports: ["websocket"],
});

export default socket;
