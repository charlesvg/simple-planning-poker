import * as http from "http";
import express = require('express');
import httpRouter from "./router";

const port = 8080;
const WebSocketServer = require('websocket').server;
const WebSocketRouter = require('websocket').router;

const app = express();
const server = http.createServer(app);

let browserConnections: Array<any> = [];

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

router.mount('*', 'echo-protocol', function(request) {

    const connection = request.accept(request.origin);
    console.log('Browser ' + connection.remoteAddress + ' connected.');
    browserConnections.push(connection);



    connection.on('message', function(message) {
        console.log('received', message);
        connection.send(message.utf8Data);
    });

    connection.on('close', function(reasonCode, description) {

        console.log('Browser ' + connection.remoteAddress + ' disconnected.');

        browserConnections = browserConnections.filter((connection) => {
            const isOpen = connection.state === 'open';
            if (!isOpen) {
                console.log('Removing stale browser connection, it is not open. Connection state =', connection.state);
            }
            return isOpen;
        });

    });
});


