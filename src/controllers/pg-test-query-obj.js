const pgHandler = require('../lib/db/postgresdb.js');

const getUser = async (user_id) => {
        const queryStr = `select * from usersample as us where user_id = $1`;

        try {
            const pgResponse = await pgHandler.query({ text: queryStr, values: [user_id]}, 0);
            return pgResponse.rows;
        } catch (error) {
            console.error(
                'pgHandler Error',
                error.message
            )
            throw error;
        }
}

module.exports = { getUser };
// getUser('1234')
//     .then(user => console.log(user))
//     .catch(err => console.log(err))