'use strict'; 
/**
 * @api private
 */
module.exports.shouldFetchFromSecretsManager = ({
        secretsLoaded,
        secretsSetAt,
        cache,
        cacheExpiryIn
    }) => {
    // if caching is OFF, or we haven't loaded anything yet, then definitely load it from SecretsManager
    if (!cache || !secretsLoaded) {
        return true;
    }
    
    // if caching is ON, and cache expiration is ON, and enough time has passed, then also load it from SecretsManager
    const now = Date.now()
    const millisSinceLastLoad = Math.abs(now - secretsSetAt);

    if (cacheExpiryIn && millisSinceLastLoad > cacheExpiryIn) {
        console.log(`secrets expired! - they need reload!`)
        return true;
    }
    
    // otherwise, don't bother
    return false;
}

/**
 * @api private
 */
module.exports.assignCacheSecrets = (secret) => {
    global.cacheSecrets = Object.assign({}, global.cacheSecrets , secret);
}

/**
 * @api private
 */
module.exports.checkAllExpiredSecrets = (cacheSecrets, secretsLoadedAt, ttl) => {
    const updatedSecrets = cacheSecrets.map( secret => {
        if(!secret.isExpired && secretsLoadedAt > ttl) {
            secret = Object.assign({}, { isExpired: true });
            return secret;
        } else {
            return secret;
        }
    })

    return updatedSecrets;
}
