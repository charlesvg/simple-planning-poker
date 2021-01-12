import {Socket} from "./socket.js";

const socketClient = new Socket();
socketClient.open();
window.socketClient = socketClient;
