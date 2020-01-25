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
    const millisSinceLastLoad = now.getTime() - secretsLoadedAt.getTime();
    if (cacheExpiryInMillis && millisSinceLastLoad > cacheExpiryInMillis) {
        return true;
    }
    
    // otherwise, don't bother
    return false;
}

module.exports.assignSecretKey = (secret) => {
    const value = Object.keys(secret)[0];
    switch (value) {
        case 'gisdb_ma':
            Object.assign(global.cacheSecrets,{ gisdb_ma: secret.value });
        case 'gisdb_maps':
            Object.assign(global.cacheSecrets,{ gisdb_maps: secret.value });
        case 'datadb_ma':
            Object.assign(global.cacheSecrets,{ datadb_ma: secret.value });
        case 'datadb_maps':
            Object.assign(global.cacheSecrets,{ datadb_maps: secret.value });
        case 'iotdb_ma':
            Object.assign(global.cacheSecrets,{ iotdb_ma: secret.value });
        case 'iotdb_maps':
            Object.assign(global.cacheSecrets,{ iotdb_maps: secret.value });
        case 'terraligndb_maps':
            Object.assign(global.cacheSecrets,{ terraligndb_maps: secret.value });
        case 'activationsdb_gm':
            Object.assign(global.cacheSecrets,{ activationsdb_gm: secret.value });
        case 'pgCred':
            Object.assign(global.cacheSecrets,{ pgCred: secret.value });
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
