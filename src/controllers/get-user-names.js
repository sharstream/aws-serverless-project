// const { query } =   require('../lib/db/postgresdb.js');
const pgPool    =   require('../lib/db/postgresdb-sync.js');
const config = require('../lib/db/config.json');
const opts = {
    awsSdkOptions: config,
    cacheExpiryInMillis: Date.now() + (0.1 * 60000),
    secrets: ['pgCred', 'gisdb_ma', 'x_api_key']//these secrets are arbitrary for now
}

const getUser = async (user_id) => {
        const queryStr = `select * from usersample as us where user_id = $1`;

        try {
            const queryOptions = await pgPool.pgInitializer(opts);
            const rows = await queryOptions.pgQuery('pgCred', { text: queryStr, values: [user_id]});
            return rows[0];
        } catch (error) {
            console.error(
                'pgHandler Error',
                error.message
            )
            throw error;
        }
}

module.exports = { getUser };