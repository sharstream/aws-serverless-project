'use strict';

const secretsFetch = require('./index.js');
const opts = {
    awsSdkOptions: {
        region: 'us-east-2'
    },
    cache: true,
    cacheExpiryInMillis: Math.floor(Date.now() * 5 * 60000),
    secrets: ['pgdev']//these secrets are arbitrary for now
}

try {
    const res = secretsFetch(opts).init();
    if(res) console.log(`Secrets successfully loaded at ${Date.now()}`)
} catch (error) {
    console.log(error)
}

const { Pool } = require('pg');

let pgPool;
const poolInitializer = async () => {
    if(!pgPool) {
        const pgCred = JSON.parse(global.cacheSecrets.pgCred);
        pgPool = new Pool({
            user: pgCred.user,
            password: pgCred.password,
            database: pgCred.dbname,
            host: pgCred.host,
            port: pgCred.port,
            max: 20,
            idleTimeoutMillis: 1000,
            connectionTimeoutMillis: 1000
        })
        pgPool.on('error', (err, client) => {
            console.log('RDS Postgress Database Error Encountered', client, err);
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