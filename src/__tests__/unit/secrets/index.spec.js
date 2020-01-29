'use strict';

const secretFecth = require('../../../lib/secrets/index.js');
const { shouldFetchFromSecretsManager, assignCacheSecrets } = require('../../../lib/helpers/utils.js');
const { getSecretsManagerInstance, getSecretsValues } = require('../../../lib/secrets/aws-secrets-manager.js');

jest.mock('../../../__mocks__/mock-secret-manager.js');
jest.mock('../../../lib/helpers/utils.js');
jest.mock('../../../lib/secrets/aws-secrets-manager.js');

describe('Primary Main SecretManager Test Suite', () => {
    let opts;
    beforeEach(async () => {

        opts = {
            awsSdkOptions: {
                region: 'test'
            },
            cacheExpiryInMillis: Date.now() + (0.1 * 60000),
            secrets: ['test', 'test2']//these secrets are arbitrary for now
        }
    });
    afterEach(async () => {
        global.cacheSecrets = [];
        shouldFetchFromSecretsManager.mockClear();
        getSecretsManagerInstance.mockClear();
        getSecretsValues.mockClear();
        assignCacheSecrets.mockClear();
    });

    test('should load all secrets frm SecretManager', async () => {
        //Mock Setup
        shouldFetchFromSecretsManager.mockReturnValue(false);
        getSecretsManagerInstance.mockResolvedValue({
            _clientId: 1,
            _events: {
                apiCall: [function CALL_EVENTS_BUBBLE(event){}],
                apiCallAttempt: [function EVENTS_BUBBLE(event){}]
            },
            _originalConfig: new Object(),
            CALL_EVENTS_BUBBLE: function CALL_EVENTS_BUBBLE(event){},
            config: {},
            endpoint: {}
        });
        getSecretsValues.mockResolvedValue([
            {
                test: {
                    dbInstanceIdentifier: 'pg',
                    dbname: 'test',
                    engine: 'postgres',
                    host: 'test',
                    isExpired: false,
                    password: 'test',
                    port: 5432,
                    username: 'test'
                }
            },
            {
                test2: {
                    dbInstanceIdentifier: 'pg2',
                    dbname: 'test2',
                    engine: 'postgres',
                    host: 'test2',
                    isExpired: false,
                    password: 'test2',
                    port: 5432,
                    username: 'test2'
                }
            }
        ]);
        assignCacheSecrets.mockReturnValue(null);

        try {
            const secretsOpts = await secretFecth().init(opts);
            expect(secretsOpts[0]).toEqual({"test": {"dbInstanceIdentifier": "pg", "dbname": "test", "engine": "postgres", "host": "test", "isExpired": false, "password": "test", "port": 5432, "username": "test"}});
            expect(secretsOpts[1]).toEqual({"test2": {"dbInstanceIdentifier": "pg2", "dbname": "test2", "engine": "postgres", "host": "test2", "isExpired": false, "password": "test2", "port": 5432, "username": "test2"}})
        } catch (error) {
            console.log(error)
        }

    });

    test('should fecth secrects from aws secret manager', async () => {
        //Mock Setup
        global.cacheSecrets.push([
            {
                secretsLoaded: true,
                secretsLoadedAt: 'Tue Jan 28 2020 10:54:36 GMT-0500',
                cache: true,
                cacheExpiryInMillis: 1580226854306,
                test: {
                    dbInstanceIdentifier: 'pg',
                    dbname: 'test',
                    engine: 'postgres',
                    host: 'test',
                    isExpired: false,
                    password: 'test',
                    port: 5432,
                    username: 'test'
                }
            },
            {
                secretsLoaded: true,
                secretsLoadedAt: 'Tue Jan 28 2020 10:54:36 GMT-0500',
                cache: true,
                cacheExpiryInMillis: 1580226854306,
                test2: {
                    dbInstanceIdentifier: 'pg2',
                    dbname: 'test2',
                    engine: 'postgres',
                    host: 'test2',
                    isExpired: false,
                    password: 'test2',
                    port: 5432,
                    username: 'test2'
                }
            }
        ]);
        shouldFetchFromSecretsManager.mockReturnValue(true);

        try {
            const secretsOpts = await secretFecth().init(opts);
            expect(secretsOpts[0]).toEqual({"test": {"dbInstanceIdentifier": "pg", "dbname": "test", "engine": "postgres", "host": "test", "isExpired": false, "password": "test", "port": 5432, "username": "test"}});
        } catch (error) {
            console.log(error)
        }
    });

    test('should throw a failed call error', async () => {
        const options = {
            awsSdkOptions: {
                region: 'test'
            },
            throwOnFailedCall: true,
            cacheExpiryInMillis: Date.now() + (0.1 * 60000),
            secrets: ['test', 'test2']//these secrets are arbitrary for now
        }
        //Mock Setup
        shouldFetchFromSecretsManager.mockReturnValue(false);
        getSecretsManagerInstance.mockResolvedValue({
            _clientId: 1,
            _events: {
                apiCall: [function CALL_EVENTS_BUBBLE(event){}],
                apiCallAttempt: [function EVENTS_BUBBLE(event){}]
            },
            _originalConfig: new Object(),
            CALL_EVENTS_BUBBLE: function CALL_EVENTS_BUBBLE(event){},
            config: {},
            endpoint: {}
        });
        getSecretsValues.mockRejectedValue(new Error('there is temporary problems with Secrets Manager.'));
        
        try {
            const throwedResponse = await secretFecth().init(options);
        } catch (error) {
            expect(error).toBeTruthy();
            expect(error.message).toBe('there is temporary problems with Secrets Manager.');
        }
    });
})