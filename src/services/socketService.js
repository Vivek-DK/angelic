import { io } from "socket.io-client";

const NODE_API =
  import.meta.env.VITE_NODE_API_URL || 'http://localhost:5000';

const socket = io(NODE_API);

export default socket;