import { v4 as uuidv4 } from 'uuid';
export class PokerServer {
    private browserConnections: Array<any> = [];

    public onConnected(connection) {

        const uuid = uuidv4();
        connection.send(JSON.stringify({
            type: 'WELCOME',
            body: {
                uuid: uuid
            }
        }));
        (connection as any).uuid = uuid;

        this.browserConnections.forEach(conn => {
            conn.send(JSON.stringify({
                type: 'CLIENT_CONNECTED',
                body: {
                    uuid: uuid
                }
            }));
        });


        this.browserConnections.push(connection);
    }
    public onMessage(connection, message) {
        console.log('Received', JSON.parse(message.utf8Data));
        this.browserConnections.forEach(conn => {
            if ((conn as any).uuid !== connection.uuid) {
                conn.send(message.utf8Data);
            }
        })
    }
    public onClosed(connection, reasonCode, description) {

        console.log('Browser ' + connection.remoteAddress + ' disconnected.');

        const removed: Array<any> = [];

        this.browserConnections = this.browserConnections.filter((connection) => {
            const isOpen = connection.state === 'open';
            if (!isOpen) {
                console.log('Removing stale browser connection, it is not open. Connection state =', connection.state);
                removed.push((connection as any).uuid);
            }
            return isOpen;
        });



        removed.forEach(removedUuid => {
            this.browserConnections.forEach(conn => {
                conn.send(JSON.stringify({
                    type: 'CLIENT_DISCONNECTED',
                    body: {
                        uuid: removedUuid
                    }
                }));
            });
        });
    }
}