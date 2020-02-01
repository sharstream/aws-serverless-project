'use strict';

global.cacheSecrets = {};
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

            let isCacheable;
            if (Object.keys(global.cacheSecrets).length > 0
            && global.cacheSecrets instanceof Object
            && typeof(global.cacheSecrets) === 'object') {
                isCacheable = (global.cacheSecrets.cache === true && global.cacheSecrets.secretsLoaded === true)
            }

            if (isCacheable && !utilsHandler.shouldFetchFromSecretsManager(global.cacheSecrets)) {
                return Promise.resolve(global.cacheSecrets);
            }
    
            secretsManagerInstance =
            secretsManagerInstance ||
            secretHelper.getSecretsManagerInstance(options.awsSdkOptions);
    
            let secretsCache, secretsResult;
            try {
                secretsCache = await secretHelper.getSecretsValues(secretsManagerInstance, options.secrets);
                if(Array.isArray(secretsCache)) {
                    options.secretsSetAt = Date.now();
                    options.secretsLoaded = true;
                    options.cache = true;

                    let secretOpts = {
                        secretsLoaded: options.secretsLoaded,
                        secretsSetAt: options.secretsSetAt,
                        cache: options.cache,
                        cacheExpiryIn: options.cacheExpiryInMillis,
                    }

                    global.cacheSecrets = {};
                      
                    secretsResult = secretsCache.reduce( (object, secret) => {
                        utilsHandler.assignCacheSecrets(secret);
                        return Object.assign(object, secret);
                    }, {});

                    global.cacheSecrets = Object.assign({}, global.cacheSecrets, secretOpts);
                    secretsResult = Object.assign({}, secretsResult, secretOpts);
                      
                    console.log( secretsResult );

                }

                return Promise.resolve(secretsResult);
            } catch (error) {
                console.error(
                    'failed to refresh secrets from Secrets Manager.',
                    error.message
                )

                if (options.throwOnFailedCall && !secretsCache && !secretsOpts) {
                    return Promise.reject(new Error('there is temporary problems with Secrets Manager.'));
                }
            }
        }
    } 
}