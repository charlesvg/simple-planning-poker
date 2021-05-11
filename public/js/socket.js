export class Socket {
    constructor() {
        this.username = window.poker.username;
        this.room = window.poker.room;
        this.clients = new Map();
        this.uuid = '';
        this.sharedState = {};
    }

    open() {
        const isSSL = window.location.protocol === 'https:';
        this.socket = new WebSocket((isSSL ? "wss://" : "ws://") + window.location.host, "echo-protocol");
        this.socket.onopen = (event) => {
            console.log('Socket open');
        }
        this.socket.onmessage = (event) => {
            const msg = JSON.parse(event.data);
            console.log('Receive', msg);
            switch (msg.type) {
                case 'WELCOME':
                    this.onWelcome(msg.body);
                    break;
                case 'CLIENT_CONNECTED_CONNECTED':
                    this.onClientConnected(msg.body);
                    break;
                case 'CLIENT_DISCONNECTED':
                    this.onClientDisconnected(msg.body);
                    break;
                case 'USER_JOINED':
                    this.onUserJoined(msg.body);
                    break;
                case 'USER_GREETING':
                    this.onUserGreeting(msg.body);
                    break;
                case 'ESTIMATE':
                    this.onEstimate(msg.body);
                    break;
            }
        }

    }


    onEstimate(body) {
        const userDetails = this.clients.get(body.uuid);
        userDetails.estimate = body.estimate;

        this.refreshUsers();
    }

    onClientDisconnected(body) {
        this.clients.delete(body.uuid);
        this.refreshUsers();
    }

    onWelcome(body) {
        this.uuid = body.uuid;
        this.clients.set(body.uuid, {
            username: this.username,
            room: this.room
        });
        this.refreshUsers();

        this.send('USER_JOINED', {
            username: this.username,
            uuid: this.uuid,
            room: this.room
        });
    }


    send(type, content) {
        this.socket.send(JSON.stringify({
            type: type,
            body: content
        }));
    }

    now() {
        return new Date().getTime();
    }

    onUserGreeting(body) {
        this.clients.set(body.uuid, {
            username: body.username,
            room: body.room,
            estimate: body.estimate
        });
        this.refreshUsers();
    }

    onClientConnected(body) {
        this.clients.set(body.uuid, {});
    }

    onUserJoined(body) {
        const userDetails = this.clients.get(body.uuid);
        userDetails.room = body.room;
        userDetails.username = body.username;
        this.refreshUsers();
        this.greetUser();
    }

    greetUser() {
        this.send('USER_GREETING', {
            username: this.username,
            uuid: this.uuid,
            room: this.room,
            estimate: this.clients.get(this.uuid).estimate
        });
    }

    vote(estimate) {
        const userDetails = this.clients.get(this.uuid);
        userDetails.estimate = estimate;
        this.refreshUsers();
        this.send('ESTIMATE', {
            uuid: this.uuid,
            estimate: estimate
        });
    }

    refreshUsers() {
        const usersElement = document.getElementById('users');

        while (usersElement.firstChild) {
            usersElement.removeChild(usersElement.lastChild);
        }

        let output = `
                            <div class="row">
                                <div class="col-md-6 user"><strong>Username</strong></div>
                                <div class="col-md-6 user"><strong>Estimate</strong></div>
                            </div>
        `;
        for (let [uuid, userDetails] of this.clients) {
            if (userDetails.room === this.room) {
                output +=
                        `
                            <div class="row">
                                <div class="col-md-6 user">${userDetails.username}</div>
                                <div class="col-md-6 user">${userDetails.estimate ? userDetails.estimate : '?'}</div>
                            </div>
                        `;
            }
        }
        usersElement.innerHTML = output;

    }
}