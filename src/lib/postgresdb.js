'use strict';

const secretsFetch = require('./index.js');
const opts = {
    awsSdkOptions: {
        region: 'us-east-1'
    },
    cache: true,
    cacheExpiryInMillis: Math.floor(Date.now() * 5 * 60000),
    secrets: ['pgCred', 'gisdb_ma']//these secrets are arbitrary for now
}

const { Pool } = require('pg');

const poolInitializer = () => {
    return new Promise((resolve, reject) => {
        secretsFetch(opts).init()
        .then(secrets => {
            if(secrets) console.log(`Secrets successfully loaded at ${Date.now()}`)
            console.log('secrets loaded::', global.cacheSecrets)
            const pgCred = global.cacheSecrets.pgCred;
            let pgPool = new Pool({
                user: pgCred.username,
                password: pgCred.password,
                database: pgCred.dbname,
                host: pgCred.host,
                port: pgCred.port,
                max: 20,
                idleTimeoutMillis: 30000,
                connectionTimeoutMillis: 2000
            });
            pgPool.on('error', (err, client) => {
                console.log('RDS Postgress Database Error Encountered', client, err);
                process.exit(1);
            });
            
            resolve(pgPool);
        })
        .catch(error =>{
            console.log('Pool error', error)
            reject(error)
        })

    })
}

const query = async (queryObject, retries) => {
    let dbResponse;
    try {
        const pgPool = await poolInitializer();
        const client = await pgPool.connect();
        dbResponse = await client.query(queryObject);
        // tell the pool to destroy this client
        client.release(true);
    } catch (error) {
        if(error.code === '28P01') {   
            //Handler Error
            retries = retries + 1;
            
            if(retries > 3)
                throw Error('Retry has been unsuccessful, check AWS-SecretsManager manager for any failover');
            
            let delay = Math.pow(2); //constraints for every postgres sleep time connections
            await new Promise(resolve => setTimeout(resolve, delay));
            await query(queryObject, retries);
        } else {
            throw Error('Postgres Unhandler Error');
        }
    }

    return dbResponse;
}

module.exports = {
    query
};