'use strict'; 
/**
 * @api private
 */
module.exports.shouldFetchFromSecretsManager = ({
        secretsLoaded,
        secretsLoadedAt,
        cache,
        cacheExpiryInMillis
    }) => {
    // if caching is OFF, or we haven't loaded anything yet, then definitely load it from SecretsManager
    if (!cache || !secretsLoaded) {
        return true;
    }
    
    // if caching is ON, and cache expiration is ON, and enough time has passed, then also load it from SecretsManager
    const now = new Date()
    const millisSinceLastLoad = Math.abs(now.getSeconds() - secretsLoadedAt.getSeconds());

    if (cacheExpiryInMillis && millisSinceLastLoad > 5) {
        console.log(`secrets expired! - they need reload!`)
        return true;
    }
    
    // otherwise, don't bother
    return false;
}

/**
 * @api private
 */
module.exports.assignCacheSecrets = (secret, secretOpts) => {
    let secretAssigned = Object.assign(secret, secretOpts);
    global.cacheSecrets.push(secretAssigned)
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
