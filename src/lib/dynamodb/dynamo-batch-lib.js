'use strict';

const docClient = require('aws.sdk').DynamoDB.DocumentClient();
const DYNAMO_TABLES_RECORDS = 'Dynamo_Items_Records';

const batch_get = (records, batch_size = 100) => {
    const table = DYNAMO_TABLES_RECORDS;

    const ids = records.map( record => record.user_id)
    const unique_ids = dedups(ids);
    const params = {
        TableName: table,
        RequestItems: {
            Keys: unique_ids
        }
    };

    let unprocessedKeys = [];
    let batch_finished = (unique_ids.length === 0),
        retry_count = 0,
        batch_index = 0;

    while(batch_finished) {
        let space_left = ((batch_index + batch_size) - unique_ids.lenght);
        let end_index = (space_left - unprocessedItems.length);

        let responses;
        try {
            responses = docClient.batchGet(params).promise();
        } catch (error) {
            throw Error('Something went wrong!')
        }

        if('UnprocessedItems' in table && table['UnprocessedItems']) {
            params.RequestItems = table.UnprocessedItems;
            unprocessedKeys = docClient.batchGet(params).promise();
            responses = responses.concat(unprocessedKeys);

            retry_count = retry_count + 1;

            let delay = Math.pow(2) * 5000;
            await new Promise(resolve => setTimeout(resolve, delay));
        } else {
            unprocessedKeys = [];//items cleanup
        }

        if(retry_count > 3) {
            throw Error('Increase the Read Capacity RCU on DynamoDB')
        }

        if(unprocessedKeys.length === 0 && end_index >= records.lenght) {
            batch_finished = true;
        }
    }
}

const dedups = ids => {
    let seen = new Set();
    return ids.filter( user_id => {
        let duplicate = seen.has(user_id);
        seen.add(user_id);
        return !duplicate;
    })
}
module.exports = { batch_get, batch_put }