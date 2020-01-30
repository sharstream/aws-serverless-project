'use strict';

global.cacheSecrets = [];
const utilsHandler = require('../helpers/utils.js');
const secretHelper = require('./aws-secrets-manager.js');
module.exports = () => {
    const defaults = {
        awsSdkOptions: {},
        secrets: {},
        throwOnFailedCall: false
    }
    
    let secretsManagerInstance = null;

    /** 
     * @desc initilization to search for a secret and return a Promise object
     * @param {Object} options all required fields to retrieve a secret and its value 
     */
    return {
        init: async (opts) => {
            const options = Object.assign({}, defaults, opts);

            let isCached;
            if (global.cacheSecrets.length > 0
            && global.cacheSecrets instanceof Array
            && Array.isArray(global.cacheSecrets)) {
                isCached = global.cacheSecrets.every(secret => (secret.cache === true && secret.secretsLoaded === true))
            }

            if ( isCached && global.cacheSecrets.every( secret => !utilsHandler.shouldFetchFromSecretsManager(secret))) {
                return Promise.all(global.cacheSecrets);
            }
    
            secretsManagerInstance =
            secretsManagerInstance ||
            secretHelper.getSecretsManagerInstance(options.awsSdkOptions);
    
            let secretsCache, secretsOpts;
            try {
                secretsCache = await secretHelper.getSecretsValues(secretsManagerInstance, options.secrets);
                if(Array.isArray(secretsCache)) {
                    options.secretsLoadedAt = new Date();
                    options.secretsLoaded = true;
                    options.cache = true;

                    let secretOpts = {
                        secretsLoaded: options.secretsLoaded,
                        secretsLoadedAt: options.secretsLoadedAt,
                        cache: options.cache,
                        cacheExpiryInMillis: options.cacheExpiryInMillis
                    }

                    global.cacheSecrets = [];
                    
                    secretsOpts = secretsCache.map(secret => {
                        utilsHandler.assignCacheSecrets(secret, secretOpts);
                        let secretObj = {}
                        secretObj = Object.assign(
                            {},
                            secret
                        )
                        return secretObj;
                    });
                }

                return Promise.all(secretsOpts)
            } catch (error) {
                console.error(
                    'failed to refresh secrets from Secrets Manager.',
                    error.message
                )

                if (options.throwOnFailedCall && !secretsCache && !secretsOpts) {
                    throw Error('there is temporary problems with Secrets Manager.');
                }
            }
        }
    } 
}