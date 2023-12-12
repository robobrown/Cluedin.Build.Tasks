"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
async function getToken(username, password, client_id, cluedinHostname) {
    const axios = require('axios');
    const qs = require('qs');
    let data = qs.stringify({
        'username': username,
        'password': password,
        'client_id': client_id,
        'grant_type': 'password'
    });
    let config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: 'https://' + cluedinHostname + '/auth/connect/token',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        data: data
    };
    return axios.request(config)
        .then((response) => {
        return response.data.access_token;
    })
        .catch((error) => {
        console.log(error);
    });
}
async function getUserId(authToken, hostname) {
    const axios = require('axios');
    let data = JSON.stringify({
        query: `query Administration {
        administration {
            me {
                client
            }
        }
    }`,
        variables: {}
    });
    let config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: 'https://' + hostname + '/graphql',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + authToken
        },
        data: data
    };
    return axios.request(config)
        .then((response) => {
        if (response.data.errors != null && response.data.errors.length > 0) {
            throw new Error(response.data.errors[0].message);
        }
        return response.data.data.administration.me.client.id;
    })
        .catch((error) => {
        console.log(error);
    });
}
exports.default = { getToken, getUserId };
