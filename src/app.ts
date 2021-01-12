import * as http from "http";
import express = require('express');
import httpRouter from "./router";
import { v4 as uuidv4 } from 'uuid';
import {strict} from "assert";

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


    const uuid = uuidv4();
    connection.send(JSON.stringify({
        type: 'WELCOME',
        body: {
            uuid: uuid
        }
    }));
    (connection as any).uuid = uuid;

    browserConnections.forEach(conn => {
        conn.send(JSON.stringify({
            type: 'USER_CONNECTED',
            body: {
                uuid: uuid
            }
        }));
    });


    browserConnections.push(connection);


    connection.on('message', function(message) {
        console.log('Received', JSON.parse(message.utf8Data));
        browserConnections.forEach(conn => {
            if ((conn as any).uuid !== connection.uuid) {
                conn.send(message.utf8Data);
            }
        })
    });

    connection.on('close', function(reasonCode, description) {

        console.log('Browser ' + connection.remoteAddress + ' disconnected.');

        const removed: Array<any> = [];

        browserConnections = browserConnections.filter((connection) => {
            const isOpen = connection.state === 'open';
            if (!isOpen) {
                console.log('Removing stale browser connection, it is not open. Connection state =', connection.state);
                removed.push((connection as any).uuid);
            }
            return isOpen;
        });



        removed.forEach(removedUuid => {
            browserConnections.forEach(conn => {
                conn.send(JSON.stringify({
                    type: 'USER_DISCONNECTED',
                    body: {
                        uuid: removedUuid
                    }
                }));
            });
        });


    });
});


