export class HttpClient {
    constructor() {
    }

    get(url) {
        return fetch(url, {headers: {"Content-Type": "application/json; charset=utf-8"}})
            .then(res => res.json()) // parse response as JSON (can be res.text() for plain response);
    }
}