import * as http from "http";
import express = require('express');
import httpRouter from "./router";
import {PokerServer} from "./poker-server";

const port = 8080;
const WebSocketServer = require('websocket').server;
const WebSocketRouter = require('websocket').router;

const app = express();
const server = http.createServer(app);



app.use(express.static('./public/'));
app.use('/', httpRouter);

server.listen(port,'0.0.0.0', () => {
    console.log('Server is listening on port', port);
});

let wsServer = new WebSocketServer({
    httpServer: server,
    // You should not use autoAcceptConnections for production
    // applications, as it defeats all standard cross-origin protection
    // facilities built into the protocol and the browser.  You should
    // *always* verify the connection's origin and decide whether or not
    // to accept it.
    autoAcceptConnections: false
});

const router = new WebSocketRouter();
router.attachServer(wsServer);

const pokerServer = new PokerServer();

router.mount('*', 'echo-protocol', function(request) {
    const connection = request.accept(request.origin);
    console.log('Browser ' + connection.remoteAddress + ' connected.');
    pokerServer.onConnected(connection);
    connection.on('message', (message) => pokerServer.onMessage(connection, message));
    connection.on('close', (reasonCode, description) => pokerServer.onClosed(connection, reasonCode, description));
});


