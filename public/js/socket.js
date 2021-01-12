export class Socket {
    constructor() {
        this.users = [window.poker.username];
        this.refreshUsers();
    }

    open() {

        const isSSL = window.location.protocol === 'https:';
        this.socket = new WebSocket((isSSL ? "wss://" : "ws://") + window.location.host, "echo-protocol");
        this.socket.onopen = (event) => {
            console.log('Socket open');
            this.socket.send(JSON.stringify({
                type: 'USER_JOINED',
                body: {
                    username: window.poker.username
                }
            }));
        }
        this.socket.onmessage = (event) => {
            const msg = JSON.parse(event.data);
            switch (msg.type) {
                case 'USER_JOINED':
                    this.handleUserJoined(msg);
                    break;
                case 'USER_GREETING':
                    this.handleUserGreeting(msg);
                    break;
            }
        }
    }

    handleUserGreeting(msg) {
        const myUsername = window.poker.username;
        const hisUsername = msg.body.username;
        if (myUsername !== hisUsername) {
            this.users.push(msg.body.username);
            this.refreshUsers();
        }
    }

    handleUserJoined(msg) {
        const myUsername = window.poker.username;
        const hisUsername = msg.body.username;
        if (myUsername !== hisUsername) {
            this.users.push(hisUsername);
            this.refreshUsers();
            this.greetUser();
            console.log(msg.body.username, 'has joined');
        }
    }

    greetUser() {
        this.socket.send(JSON.stringify({
            type: 'USER_GREETING',
            body: {
                username: window.poker.username
            }
        }));
    }

    refreshUsers() {
        const usersElement = document.getElementById('users');

        while (usersElement.firstChild) {
            usersElement.removeChild(usersElement.lastChild);
        }

        let output = '';
        this.users.forEach(user => {
            output += `<div class="col user rounded-top">${user}</div><div class="w-100"></div>`;
        })
        usersElement.innerHTML = output;

    }
}