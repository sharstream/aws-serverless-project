'use strict';
let secretsManagerInstance;
module.exports = class SecretManager {
    constructor(opts) {
        this.defaults = {
            awsSdkOptions: {},
            secrets: {},
            cache: false,
            secretsLoaded: false,
            secretCache: undefined,
            secretsLoadedAt: new Date(0)
        }
        this.options = Object.assign({}, this.defaults, opts);

        if(opts.region) {
            this.region = region;
        }
    }

    /**
     * @desc Calling the createSecret operation
     * @param param list of required properties to seed secret manager obj
    */
    async createSecret(param) {

        return new Promise((resolve, reject) => {
            const params = {
                Name: param.name, //'STRING_VALUE', /* required */
                ClientRequestToken: param.client, //'STRING_VALUE',
                Description: param.description, //'STRING_VALUE',
                KmsKeyId: param.key, //'STRING_VALUE',
                SecretBinary: Buffer.from(param.raw), //|| 'STRING_VALUE' /* Strings will be Base-64 encoded on your behalf */,
                SecretString: param.secretName, //'STRING_VALUE',
                Tags: [
                  {
                    Key: 'postgres',
                    Value: param.tabValue
                  },
                  /* more items */
                ]
            };
            this.secretsmanager.createSecret(params, function(err, data) {
                if (err) {
                    console.log(err, err.stack); // an error occurred
                    reject(err)
                }
                 
                console.log(data); // successful response
                resolve({ secret: data }) // use encryption
            });
        })
    }

    /**
     * @desc initilization to search for a secret and return a Promise object
     * @param {Object} options all required fields to retrieve a secret and its value 
     */
    async init(options) {
        if (options.secretsCache) {
            options.secretsCache.forEach(object => {
              Object.assign(global._cacheObject, object)
            })
        }

        if(!shouldFetchFromSecretsManager(options)){
            return next();
        }

        secretsManagerInstance =
        secretsManagerInstance ||
        this.getSecretsManagerInstance(options.awsSdkOptions)

        let getSecrets;
        try {
            getSecrets = await this.getSecretsValues(options.secrets, secretsManagerInstance);
        } catch (error) {
            console.error(
                'failed to refresh secrets from Secrets Manager.',
                err.message
            )
            throw Error('failed to refresh secrets from Secrets Manager.');
        }

        if (options.throwOnFailedCall && !options.secretsCache) {
            throw Error('there is temporary problems with Secrets Manager.');
        }

        if (options.secretsCache) {
            options.secretsLoadedAt = new Date()
        }
    }

    /**
     * @desc grab and loop through all secrets based on a name and value
     * @param {Array<Object>} secrets list of all secrets available
     * @param {SecretsManager} secretManager aws SecretsManager instance 
     */
    async getSecretsValues(secrets, secretManager) {
        const secretsPromises = Object.keys(secrets).map(async key => {
            let secretName = secrets[key];
            let secretValue;
            try {
                secretValue = await secretManager.getSecretValue({ SecretId: secretName }).promise();
            } catch (error) {
                console.log('Something went wrong with HTTP Secret Manager request', error);
                throw Error('Something went wrong with HTTP Secret Manager request');
            }

            const secret = JSON.parse(secretValue.SecretString || '{}');
            
            return {
                key: secret,
                value: secretValue,
                isBeingUsed: true
            }
        });

        return Promise.all(secretsPromises);
    }

    shouldFetchFromSecretsManager = ({
        secretsLoaded,
        secretsLoadedAt,
        cache,
        cacheExpiryInMillis
      }) => {
        // if caching is OFF, or we haven't loaded anything yet, then definitely load it from SecretsManager
        if (!cache || !secretsLoaded) {
            return true
        }
      
        // if caching is ON, and cache expiration is ON, and enough time has passed, then also load it from SecretsManager
        const now = new Date()
        const millisSinceLastLoad = now.getTime() - secretsLoadedAt.getTime()
        if (cacheExpiryInMillis && millisSinceLastLoad > cacheExpiryInMillis) {
            return true
        }
      
        // otherwise, don't bother
        return false
    }

    /**
     * @param{Object} awsSdkOptions
     * @return an instance for AWS SecretsManager
     */
    getSecretsManagerInstance = awsSdkOptions => {
        const { SecretsManager } = require('aws-sdk');
        return new SecretsManager(awsSdkOptions);
    }
}