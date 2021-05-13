export class Socket {
    constructor() {
        this.peers = new Map();
        this.privateState = {
            estimate: undefined
        };
        this.state = {
            username: window.poker.username,
            room: window.poker.room,
            isScrumMaster: window.poker.isScrumMaster,
            uuid: undefined,
            estimate: undefined,
            isEstimateReady: false,
            shouldShowEstimates: false,
            shouldResetEstimates: false
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

        if (msg.state.shouldShowEstimates) {
            this.state.estimate = this.privateState.estimate;
            for (let uuid of this.peers.keys()) {
                this.sendTo(uuid);
            }
        } else if (msg.state.shouldResetEstimates) { {
                this.state.shouldShowEstimates = false;
                this.state.isEstimateReady = false;
                this.privateState.estimate = undefined;
                this.state.estimate = undefined;
                for (let [uuid, peerState] of this.peers) {
                    peerState.shouldShowEstimates = false;
                    peerState.isEstimateReady = false;
                    peerState.estimate = undefined;
                }
            }
        }

        this.refreshUsers();
    }


    onConnected(body) {
        this.state.uuid = body.uuid;
        this.refreshUsers();
    }
    resetEstimates() {
        this.state.shouldShowEstimates = false;
        this.state.isEstimateReady = false;
        this.privateState.estimate = undefined;
        this.state.estimate = undefined;
        this.state.shouldResetEstimates = true;
        for (let uuid of this.peers.keys()) {
            this.sendTo(uuid);
        }
        this.state.shouldResetEstimates = false;
        for (let [uuid, peerState] of this.peers) {
            peerState.shouldShowEstimates = false;
            peerState.isEstimateReady = false;
            peerState.estimate = undefined;
        }
        this.refreshUsers();
    }

    showEstimates() {
        this.state.shouldShowEstimates = true;
        this.state.estimate = this.privateState.estimate;
        for (let uuid of this.peers.keys()) {
            this.sendTo(uuid);
        }
        this.refreshUsers();
    }

    vote(estimate) {
        this.privateState.estimate = estimate;
        this.state.isEstimateReady = true;
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
        `;

        const list = Array.from(this.peers.values());
        list.push(this.state);
        list.sort((a,b) => (a.username || '').localeCompare(b.username || ''));

        for (let state of list) {
            if (state.room === this.state.room) {
                output +=
                    `
                            <div class="row">
                                <div class="col-md-6 user">${state.username + (state.isScrumMaster ? '*' : '')}</div>
                                <div class="col-md-6 user">${state.estimate ? state.estimate : (state.isEstimateReady ? 'Ready' : '?')}</div>
                            </div>
                        `;
            }
        }
        usersElement.innerHTML = output;
    }
}