// const { query } =   require('../lib/db/postgresdb.js');
const pgPool    =   require('../lib/db/postgresdb-sync.js');
const config = require('../lib/db/config.json');
const opts = {
    awsSdkOptions: config,
    cacheExpiryInMillis: Date.now() + (0.1 * 60000),
    secrets: ['pgCred', 'gisdb_ma']//these secrets are arbitrary for now
}

const getUser = async (user_id) => {
        const queryStr = `select * from usersample as us where user_id = $1`;

        try {
            const queryOptions = await pgPool.pool(opts);
            const rows = await queryOptions.query({ text: queryStr, values: [user_id]});
            return rows[0];
        } catch (error) {
            console.error(
                'pgHandler Error',
                error.message
            )
            throw error;
        }
}

// module.exports = { getUser };
getUser('1234')
    .then(user => {
        console.log(user)
    })
    .catch(err => console.log(err))