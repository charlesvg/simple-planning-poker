export class Socket {
    constructor() {
        this.users = [];
    }

    open() {
        const isSSL = window.location.protocol === 'https:';
        this.socket = new WebSocket((isSSL ? "wss://" : "ws://") + window.location.host, "echo-protocol");
        this.socket.onopen = (event) => {
            console.log('Socket open');
            this.socket.send(JSON.stringify({
                type: 'USER_JOINED',
                body: {
                    username: localStorage.getItem('username')
                }
            }));
        }
        this.socket.onmessage = (event) => {
            const msg = JSON.parse(event.data);
           switch (msg.type) {
               case 'USER_JOINED':
                   this.users.push(msg.body.username);
                   this.refreshUsers();
                   console.log(msg.body.username, 'has joined');
                   break;
           }
        }
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