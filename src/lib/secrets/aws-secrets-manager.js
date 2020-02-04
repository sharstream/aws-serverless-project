'use strict';

 /**
  * @api private
 * @desc Calling the createSecret operation.
 *  For storing multiple values, we recommend that you use a JSON text string argument and specify key/value pairs
 * @param param list of required properties to seed secret manager obj
*/
module.exports.createSecret = async (secretsManagerInstance, param) => {

    return new Promise((resolve, reject) => {
        const params = {
            Name: param.name, //'STRING_VALUE', /* required */
            Description: param.description, //'STRING_VALUE',
            SecretString: JSON.stringify(param.value)//JSON Format - SDK requires quotation marks around the parameter
        };
        secretsManagerInstance.createSecret(params, function(err, data) {
            if (err) {
                console.log(err, err.stack); // an error occurred
                if(err.code === 'InvalidParamterType')
                    reject({ error: err.code, message: err.message })
            }
             
            console.log(data); // successful response
            resolve({ success: data }) // use encryption
        });
    })
}

/**
 * @api private
 * @desc grab and loop through all secrets based on a name and value
 * @param {Array<Object>} secrets list of all secrets available
 * @param {SecretsManager} secretsManagerInstance aws SecretsManager instance 
 */
module.exports.getSecretsValues = async (secretsManagerInstance, secrets) => {
    let secretsPromises = Object.keys(secrets).map(async key => {
        let secretName = secrets[key];
        let secretKey, secretProperty = {};
        try {
            secretKey = await secretsManagerInstance.getSecretValue({ SecretId: 'pgCred' }).promise();
            let secret = {};
            if (!IsJsonString(secretKey.SecretString)) {
                secret[secretName] = secretKey.SecretString;
                secretProperty = Object.assign({}, secret);
            } else {
                let secret = JSON.parse(secretKey.SecretString || '{}');
                secretProperty[secretName] = secret;
                secretProperty[secretName].isExpired = false;
            }

        } catch (error) {
            // console.log('Something went wrong with HTTP Secret Manager request', error);
            throw Error('Something went wrong with HTTP Secret Manager request');
        }

        console.log(secretProperty)
        return secretProperty;
    });

    return Promise.all(secretsPromises);
}

const IsJsonString = (str) => {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}

/**
 * @api private
 * @param{Object} awsSdkOptions
 * @return an instance for AWS SecretsManager
 */
module.exports.getSecretsManagerInstance = (awsSdkOptions) => {
    const { SecretsManager } = require('aws-sdk');
    return new SecretsManager(awsSdkOptions);
}