'use strict';

const SecretManager = require('./secretclient.js');
const secretClient = new SecretManager({
    awsSdkOptions: {
        region: 'us-east-2'
    },
    secrets: ['pgdev']//these secrets are arbitrary for now
})

secretClient.init();
const { Pool } = require('pg');

let pgPool;
const poolInitializer = async () => {
    if(!pgPool) {
        pgPool = new Pool({
            username: process.env.username,
            password: process.env.password,
            database: process.env.dbname,
            host: process.env.host,
            port: process.env.port,
            max: 20,
            idleTimeoutMillis: 1000,
            connectionTimeoutMillis: 1000
        })
        pgPool.on('error', (err, client) => {
            console.log('RDS Postgress Database Error Encountered', cient, err);
            process.exit(1);
        })
    }

    return pgPool;
}

const query = async queryObject => {
    let dbResponse;
    try {
        await poolInitializer();
        dbResponse = await pgPool.query(queryObject);
    } catch (error) {
        if(error.code === '28P01' && retry_pool === false) {
            throw Error('Authentication failed')
        }
        throw error;
    }

    return dbResponse;
}

module.exports = {
    query
};