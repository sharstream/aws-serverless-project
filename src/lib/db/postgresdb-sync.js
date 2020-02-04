'use strict';

const POSTGRES_AUTH_CODE = '28P01';
const Pool = require('pg-pool');
const fetchSecrets = require('../secrets/index.js');

const pgInitializer = async (opts) => {
    let secrets, pgPool, iotPool, retry_failed = false;
    this.renewalSecrets = async () => {
        secrets = await fetchSecrets().init(opts);
    }
    this.checkPoolOptions = (options) => {
        return Object.keys(options).every(() => (
            'user' in options || 
            'password' in options ||
            'database' in options ||
            'host' in options ||
            'port' in options ||
            'max' in options ||
            'idleTimeoutMillis' in options ||
            'connectionTimeoutMillis' in options))
    }
    this.pgInit = async (secretName) => {
        if (!secrets || retry_failed) await this.renewalSecrets();
        let pgCred = secrets[secretName];
        console.log(`renewal secret: ${JSON.stringify(pgCred)}`)
        pgPool = new Pool({
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
    this.iotInit = async () => {
        if (!secrets || retry_failed) await this.renewalSecrets();
        let gisdb_ma = secrets.gisdb_ma;
        console.log(`renewal secret: ${JSON.stringify(gisdb_ma)}`)
        iotPool = new Pool({
            user: process.env.username,
            password: gisdb_ma.password,
            database: gisdb_ma.dbname,
            host: gisdb_ma.host,
            port: gisdb_ma.port,
            max: 20,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000
        })
    }
    return {
        pgQuery: async (poolName, queryPg) => {
            let retry_count = 0, client;
            while(retry_count < 3) {
                
                try {
                    if (!pgPool || retry_failed) await this.pgInit(poolName);
                    if (!this.checkPoolOptions(pgPool.options)) await this.pgInit(poolName);
                    client = await pgPool.connect();
                    const { rows } = await pgPool.query(queryPg);
                    client.release();
                    return rows;
                } catch (error) {
                    retry_count++;
                    retry_failed = true;
                    // console.log(`retrying connection pooling ${retry_count} More Time${retry_count > 1 ? 's' : ''}! in ${JSON.stringify(pgPool.options)}`)
                    if (client) client.release();
                    if (error.code === POSTGRES_AUTH_CODE) {
                        let interval = Math.pow(2, retry_count) * 1000; //exponential backoff for every postgres sleep time connections
                        if (retry_count >= 2) process.env.username = 'postgres';
                        await new Promise(resolve => setTimeout(resolve, interval));
                    } else {
                        throw error;
                    }
                }
            }
        },
        iotQuery: async (queryIot) => {
            let retry_count = 0, client;
            while(retry_count < 3) {
                
                try {
                    if (!iotPool || retry_failed) await this.iotInit();
                    if (!this.checkPoolOptions(iotPool.options)) {
                        await this.iotInit();
                    }
                    client = await iotPool.connect();
                    const { rows } = await iotPool.query(queryIot);
                    client.release();
                    return rows;
                } catch (error) {
                    retry_count++;
                    retry_failed = true;
                    console.log(`retrying connection pooling ${retry_count} More Time${retry_count > 1 ? 's' : ''}! in ${JSON.stringify(iotPool.options)}`)
                    if (client) client.release();
                    if (error.code === POSTGRES_AUTH_CODE) {
                        let interval = Math.pow(2, retry_count) * 1000; //exponential backoff for every postgres sleep time connections
                        if (retry_count >= 2) process.env.username = 'postgres';
                        await new Promise(resolve => setTimeout(resolve, interval));
                    } else {
                        throw error;
                    }
                }
            }
        }
    }
}

module.exports = { pgInitializer }