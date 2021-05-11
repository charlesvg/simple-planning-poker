export class Socket {
    constructor() {
        this.peers = new Map();
        this.state = {
            username: window.poker.username,
            room: window.poker.room,
            uuid: undefined
        };
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
                    this.onConnected(msg.body);
                    break;
                case 'STATE':
                    this.onState(msg);
                    break;
                case 'PEER_CONNECTED':
                    this.onPeerConnected(msg.body);
                    break;
                case 'PEER_DISCONNECTED':
                    this.onPeerDisconnected(msg.body);
                    break;
            }
        }

    }

    onPeerConnected(body) {
        this.peers.set(body.uuid, {});
        this.sendTo(body.uuid);
        this.refreshUsers();
    }

    onPeerDisconnected(body) {
        this.peers.delete(body.uuid);
        this.refreshUsers();
    }

    onState(msg) {
        if (!this.peers.get(msg.source)) {
            this.sendTo(msg.source);
        }

        this.peers.set(msg.source, msg.state);
        this.refreshUsers();
    }


    onConnected(body) {
        this.state.uuid = body.uuid;
        this.refreshUsers();
    }

    vote(estimate) {
        this.state.estimate = estimate;
        for (let uuid of this.peers.keys()) {
            this.sendTo(uuid);
        }
        this.refreshUsers();
    }

    toggleHost(isHost) {
        this.state.isHost = isHost;
        for (let uuid of this.peers.keys()) {
            this.sendTo(uuid);
        }
        this.refreshUsers();
    }

    sendTo(target) {
        this.socket.send(JSON.stringify({
            type: 'STATE',
            target: target,
            source: this.state.uuid,
            state: this.state
        }));
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
                            <div class="row">
                                <div class="col-md-6 user">${this.state.username + (this.state.isHost ? ' (host)' : '')}</div>
                                <div class="col-md-6 user">${this.state.estimate ? this.state.estimate : '?'}</div>
                            </div>
        `;
        for (let [uuid, state] of this.peers) {
            if (state.room === this.state.room) {
                output +=
                    `
                            <div class="row">
                                <div class="col-md-6 user">${state.username + (state.isHost ? ' (host)' : '')}</div>
                                <div class="col-md-6 user">${state.estimate ? state.estimate : '?'}</div>
                            </div>
                        `;
            }
        }
        usersElement.innerHTML = output;
    }
}