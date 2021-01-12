export class Socket {
    constructor() {
        this.username = window.poker.username;
        this.users = new Map();
        this.users.set(this.username, {lastSeen: new Date().getTime()});
        this.refreshUsers();
    }

    open() {
        const isSSL = window.location.protocol === 'https:';
        this.socket = new WebSocket((isSSL ? "wss://" : "ws://") + window.location.host, "echo-protocol");
        this.socket.onopen = (event) => {
            console.log('Socket open');
            this.notifyOthersWeJoined();
        }
        this.socket.onmessage = (event) => {
            const msg = JSON.parse(event.data);
            switch (msg.type) {
                case 'USER_JOINED':
                    this.onUserJoined(msg);
                    break;
                case 'USER_GREETING':
                    this.onUserGreeting(msg);
                    break;
                case 'HEARTBEAT':
                    this.onHeartBeat(msg);
                    break;
            }
        }

        setInterval(() => {
            this.sendHeartBeat();
            this.checkUsersAreLive();
        }, 2000);
    }

    onHeartBeat(msg) {
        const remoteUsername = msg.body.username;
        this.users.get(remoteUsername).lastSeen = this.now();
    }

    checkUsersAreLive() {
        let usersToRemove = [];
        for (let [username, userDetails] of this.users) {
            if (userDetails.lastSeen + 3000 < this.now()) {
                usersToRemove.push(username);
                console.log('User', username, 'timed out');
            }
        }
        usersToRemove.forEach(username => this.users.delete(username));
        if (usersToRemove.length !== 0) {
            this.refreshUsers();
        }
    }

    sendHeartBeat() {
        this.send('HEARTBEAT', {
            username: this.username
        });
    }

    notifyOthersWeJoined() {
        this.send('USER_JOINED', {
            username: this.username
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

    onUserGreeting(msg) {
        const remoteUsername = msg.body.username;
        if (this.username !== remoteUsername) {
            this.users.set(remoteUsername, {lastSeen: this.now()});
            this.refreshUsers();
        }
    }

    onUserJoined(msg) {
        const remoteUsername = msg.body.username;
        if (this.username !== remoteUsername) {
            this.users.set(remoteUsername, {lastSeen: this.now()});
            this.refreshUsers();
            this.greetUser();
        }
    }

    greetUser() {
        this.send('USER_GREETING', {
            username: this.username
        });
    }

    refreshUsers() {
        const usersElement = document.getElementById('users');

        while (usersElement.firstChild) {
            usersElement.removeChild(usersElement.lastChild);
        }

        let output = '';
        for (let [username, userDetails] of this.users) {
            output += `<div class="col user rounded-top">${username}</div><div class="w-100"></div>`;
        }
        usersElement.innerHTML = output;

    }
}