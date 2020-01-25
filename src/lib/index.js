'use strict';

global.cacheSecrets = {};

const utilsHandler = require('./utils.js');
const secretHelper = require('./aws-secrets-manager.js');

module.exports = opts => {
    const defaults = {
        awsSdkOptions: {},
        secrets: {},
        cache: false,
        secretsLoaded: false,
        secretCache: undefined,
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
            if (options.secretsCache.length > 0 ) {
                options.secretsCache.forEach(key => {
                    utilsHandler.assignSecretKey(key);
                })
            }

            if (!utilsHandler.shouldFetchFromSecretsManager(options)){
                return next();
            }
    
            secretsManagerInstance =
            secretsManagerInstance ||
            secretHelper.getSecretsManagerInstance(options.awsSdkOptions);

            if (options.throwOnFailedCall && !options.secretsCache) {
                throw Error('there is temporary problems with Secrets Manager.');
            }
    
            if (options.secretsCache) {
                options.secretsLoadedAt = new Date()
            }
    
            let secretsCache;
            try {
                secretsCache = await secretHelper.getSecretsValues(options.secrets, secretsManagerInstance, options);
                if(Array.isArray(secretsCache)) {
                    secretsCache.forEach(secret => {
                        utilsHandler.assignSecretKey(secret);
                    })
                }

                return Promise.resolve({ success: true })
            } catch (error) {
                console.error(
                    'failed to refresh secrets from Secrets Manager.',
                    error.message
                )
                throw Error('failed to refresh secrets from Secrets Manager.');
            }

        }
    } 
}