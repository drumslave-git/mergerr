class API {
    constructor() {
        // this._pull = new Map();
    }

    async _make(method, uri, init = {}) {
        // const key = `${method} ${uri} ${init.body}`;
        // if(this._pull.has(key)) {
        //     return this._pull.get(key)
        // }
        const request = fetch(uri, init);
        // this._pull.set(key, request);
        const response = await request;
        // this._pull.delete(key);
        return await response.json();
    }

    async get(uri) {
        const resp = await this._make('GET', uri);
        return await resp;
    }

    async post(uri, data) {
        const resp = await this._make('POST', uri, {
            method: 'post',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        return await resp;
    }
}

const api = new API();