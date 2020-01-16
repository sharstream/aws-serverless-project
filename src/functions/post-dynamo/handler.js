'use strict';

const aws = require('aws-sdk');

const s3 = new aws.S3({ region: 'us-east-1' });

module.exports.backup = async (event, context, callback) => {
  const records = event.Records;

  //Refactor Promise Object as an array of promise
  if(!process.env.BUCKET) throw new Error('Bucket environment is required');
  if(!process.env.PREFIX) throw new Error('Prefix environment is required');
  if(!process.env.TABLE) throw new Error('Dynamo Table environment is required');

  try {
    const res = await execMultipleBatch(records, 10)
    if(res) return res;
  } catch (err) {
    console.error('Error', err);
    throw new Error('Response was unsuccessful');
  }
};

const getKeyValueDefinitions = record => {
  const keysValueDefinitions = Object.keys(record.dynamodb.Keys).map((key) => {
    const keyDefinition = record.dynamodb.Keys[key];
    const type = Object.keys(keyDefinition)[0];
    const value = keyDefinition[type];
    return value;
  });

  return keysValueDefinitions;
};

const execMultipleBatch = async (records, batchSize, done) => {
  const promises = new Array();
  
  while(records.length !== batchSize) {
    const keysList = getKeyValueDefinitions(record);
    const keysString = keysList.join('/');
    const image = aws.DynamoDB.Converter.output({ M: record.dynamodb.NewImage });

    const params = {
      Bucket: process.env.BUCKET,
      Key: `${process.env.PREFIX}/${process.env.TABLE}/${keysString}/image.json`,
      Body: JSON.stringify(image),
    }

    console.log(`${keysString} snapshot pushed`);

    promises.push(s3.putObject(params, record))
  }

  return Promise.all(promises);
};
