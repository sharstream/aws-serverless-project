'use strict';

const utilsHandler = require('../helpers/utils.js');
const secretHelper = require('./aws-secrets-manager.js');
global.cacheSecrets = {};
module.exports = opts => {
    const defaults = {
        awsSdkOptions: {},
        secrets: {},
        cache: false,
        throwOnFailedCall: false,
        cacheExpiryInMillis: undefined,
        secretsCache: undefined,
        secretsLoadedAt: new Date(0)
    }
    const options = Object.assign({}, defaults, opts);
    let secretsManagerInstance = null;

    /** 
     * @desc initilization to search for a secret and return a Promise object
     * @param {Object} options all required fields to retrieve a secret and its value 
     */
    return {
        init: async () => {
            if (options.secretsCache) {
                options.secretsCache.forEach(key => {
                    utilsHandler.assignSecretKey(key);
                })
            }

            if (!utilsHandler.shouldFetchFromSecretsManager(options)){
                // console.log('it should not fetch from SecretsManager');
                // console.log(JSON.stringify(global.cacheSecrets))
                return Promise.resolve(Object.keys(global.cacheSecrets).map(secret => secret));
            }

            // console.log('after fetching secrets from cache!');
    
            secretsManagerInstance =
            secretsManagerInstance ||
            secretHelper.getSecretsManagerInstance(options.awsSdkOptions);
    
            let secretsCache;
            try {
                secretsCache = await secretHelper.getSecretsValues(secretsManagerInstance, options.secrets);
                if(Array.isArray(secretsCache)) {
                    
                    secretsCache.forEach(secret => {
                        utilsHandler.assignSecretKey(secret);
                    })
                }

                options.secretsCache = secretsCache;
                options.secretsLoadedAt = new Date();
                options.secretsLoaded = true;

                return Promise.all(secretsCache)
            } catch (error) {
                console.error(
                    'failed to refresh secrets from Secrets Manager.',
                    error.message
                )

                if (options.throwOnFailedCall && !options.secretsCache) {
                    throw Error('there is temporary problems with Secrets Manager.');
                }
        
                if (options.secretsCache) {
                    options.secretsLoadedAt = new Date()
                }
            }

        }
    } 
}