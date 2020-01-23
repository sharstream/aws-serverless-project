'use strict';
global._cacheObject = {};
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
        this.secretsManagerInstance = null;
        if(this.options.awsSdkOptions.region) {
            this.region = this.options.awsSdkOptions.region;
        }
    }

    /**
     * @desc Calling the createSecret operation.
     *  For storing multiple values, we recommend that you use a JSON text string argument and specify key/value pairs
     * @param param list of required properties to seed secret manager obj
    */
    async createSecret(param) {

        return new Promise((resolve, reject) => {
            const params = {
                Name: param.name, //'STRING_VALUE', /* required */
                Description: param.description, //'STRING_VALUE',
                SecretString: JSON.stringify(param.value)//JSON Format - SDK requires quotation marks around the parameter
            };
            this.secretsManagerInstance.createSecret(params, function(err, data) {
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
     * @desc initilization to search for a secret and return a Promise object
     * @param {Object} options all required fields to retrieve a secret and its value 
     */
    async init() {
        if (this.options.secretsCache === undefined) {
            this.options.secretsCache.forEach(object => {
                if(object.dbname === 'pg_db') {
                    const pgCurrentCred = {
                        pgCred: object
                    }
                    Object.assign(global._cacheObject, pgCurrentCred);
                }
            })
        } else {

            if (!this.shouldFetchFromSecretsManager(this.options)){
                return next();
            }
    
            this.secretsManagerInstance =
            this.secretsManagerInstance ||
            this.getSecretsManagerInstance(this.options.awsSdkOptions);

            if (this.options.throwOnFailedCall && !this.options.secretsCache) {
                throw Error('there is temporary problems with Secrets Manager.');
            }
    
            if (this.options.secretsCache) {
                this.options.secretsLoadedAt = new Date()
            }
    
            let secretsCache;
            try {
                secretsCache = await this.getSecretsValues(this.options.secrets, this.secretsManagerInstance);
                if(Array.isArray(secretsCache)) {
                    secretsCache.forEach(secret => {
                        this.storageSecretKey(secret);
                    })
                }
            } catch (error) {
                console.error(
                    'failed to refresh secrets from Secrets Manager.',
                    error.message
                )
                throw Error('failed to refresh secrets from Secrets Manager.');
            }
        }
    }

    storageSecretKey(secret) {
        switch (secret.key) {
            case 'gisdb_ma':
                Object.assign(global._cacheObject,{ gisdb_ma: secret.value });
            case 'gisdb_maps':
                Object.assign(global._cacheObject,{ gisdb_maps: secret.value });
            case 'datadb_ma':
                Object.assign(global._cacheObject,{ datadb_ma: secret.value });
            case 'datadb_maps':
                Object.assign(global._cacheObject,{ datadb_maps: secret.value });
            case 'iotdb_ma':
                Object.assign(global._cacheObject,{ iotdb_ma: secret.value });
            case 'iotdb_maps':
                Object.assign(global._cacheObject,{ iotdb_maps: secret.value });
            case 'terraligndb_maps':
                Object.assign(global._cacheObject,{ terraligndb_maps: secret.value });
            case 'activationsdb_gm':
                Object.assign(global._cacheObject,{ activationsdb_gm: secret.value });
            case 'pgCred':
                Object.assign(global._cacheObject,{ pgCred: secret.value });
            default:
                break;
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
            let secretKey;
            try {
                secretKey = await secretManager.getSecretValue({ SecretId: secretName }).promise();
            } catch (error) {
                console.log('Something went wrong with HTTP Secret Manager request', error);
                throw Error('Something went wrong with HTTP Secret Manager request');
            }

            const secret = JSON.parse(secretKey.SecretString || '{}');

            return {
                key: secretKey.Name,
                value: secret,
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