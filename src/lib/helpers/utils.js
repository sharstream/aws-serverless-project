'use strict';
    
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

module.exports.assignSecretKey = (secret, options) => {
    const value = Object.keys(secret)[0];
    let secretOpts = {
        secretsLoaded: options.secretsLoaded,
        secretsLoadedAt: options.secretsLoadedAt,
        cache: options.cache,
        cacheExpiryInMillis: options.cacheExpiryInMillis
    }
    let secretAssigned = Object.assign(secret, secretOpts);
    switch (value) {
        case 'gisdb_ma':
            global.cacheSecrets.push(secretAssigned);
            break;
        case 'gisdb_maps':
            global.cacheSecrets.push(secretAssigned);
            break;
        case 'datadb_ma':
            global.cacheSecrets.push(secretAssigned);
            break;
        case 'datadb_maps':
            global.cacheSecrets.push(secretAssigned);
            break;
        case 'iotdb_ma':
            global.cacheSecrets.push(secretAssigned);
            break;
        case 'iotdb_maps':
            global.cacheSecrets.push(secretAssigned);
            break;
        case 'terraligndb_maps':
            global.cacheSecrets.push(secretAssigned);
            break;
        case 'activationsdb_gm':
            global.cacheSecrets.push(secretAssigned);
            break;
        case 'pgCred':
            global.cacheSecrets.push(secretAssigned);
            break;
        default:
            break;
    }
}

module.exports.checkAllExpiredSecrets = (cacheSecrets, secretsLoadedAt, ttl) => {
    const updatedSecrets = cacheSecrets.map( secret => {
        if(secret.isExpired && secretsLoadedAt > ttl) {
            secret = Object.assign({}, { isExpired: true });
            return secret;
        } else {
            return secret;
        }
    })

    return updatedSecrets;
}
