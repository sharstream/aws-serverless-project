'use strict';

const secretsFetch = require('../secrets/index.js');
const opts = {
    awsSdkOptions: {
        region: 'us-east-1'
    },
    cacheExpiryInMillis: Date.now() + (0.1 * 60000),
    secrets: ['pgCred', 'gisdb_ma']//these secrets are arbitrary for now
}

const { Pool } = require('pg');
// console.log(`cacheExpiryInMillis: ${opts.cacheExpiryInMillis}`)
/**
 * @api private
 */
const poolInitializer = () => {
    return new Promise((resolve, reject) => {
        secretsFetch().init(opts)
        .then(secrets => {
            if(secrets) console.log(`Secrets successfully loaded at ${Date.now()}`)
            console.log('secrets cached::', global.cacheSecrets)
            const pgCred = secrets[0].pgCred;
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
            reject(error)
        })

    })
}

const query = async (queryObject, retriesLeft) => {
    let dbResponse;
    try {
        const pgPool = await poolInitializer();
        const client = await pgPool.connect();
        dbResponse = await client.query(queryObject);
        // tell the pool to destroy this client
        client.release(true);//client.end()
    } catch (error) {
        if(error.code === '28P01') {   
            //caught Error
            retriesLeft = retriesLeft + 1;

            if(retriesLeft >= 3)
                throw Error('Max retries exceeded, please check AWS-SecretsManager manager for any sync failover');
            
            let interval = Math.pow(2, retriesLeft) * 3000; //exponential backoff for every postgres sleep time connections
            await new Promise(resolve => setTimeout(resolve, interval));
            return await query(queryObject, retriesLeft);
        } else {
            throw Error('Postgres Uncaught Error');
        }
    }

    return dbResponse;
}

module.exports = {
    query
};