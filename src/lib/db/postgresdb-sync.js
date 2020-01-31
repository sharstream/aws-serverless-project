'use strict';

const POSGTRES_AUTH_CODE = '28P01';
const pgPool = require('pg-pool');
const fetchSecrets = require('../secrets/index.js');

const pool = async (opts) => {
    let secrets, pool;
    this.renewalSecrets = async () => {
        secrets = await fetchSecrets().init(opts);
    }
    this.init = async () => {
        if (!secrets) await this.renewalSecrets();
        let pgCred = secrets[0].pgCred;
        pool = new pgPool({
            user: process.env.username,
            password: pgCred.password,
            database: pgCred.dbname,
            host: pgCred.host,
            port: pgCred.port,
            max: 20,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000
        })
    }
    return {
        query: async (queryOptions) => {
            let retries = 0, client;
            while(retries < 3) {
                try {
                    if (!pool) await this.init();
                    client = await pool.connect();
                    const { rows } = await pool.query(queryOptions);
                    client.release();
                    return rows;
                } catch (error) {
                    if (client) client.release();
                    if (error.code === POSGTRES_AUTH_CODE) {
                        console.log(`retrying connection pooling! ONE MORE TIME`)
                        let interval = Math.pow(2, retries) * 3000; //exponential backoff for every postgres sleep time connections
                        if (retries >= 2) process.env.username = 'postgres';
                        await new Promise(resolve => setTimeout(resolve, interval));
                        retries++;
                    } else {
                        throw error;
                    }
                }
            }
        }
    }
}

module.exports = { pool }