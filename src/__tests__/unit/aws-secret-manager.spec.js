'use strict';

const secretFecth = require('../../lib/secrets/index.js');
const { shouldFetchFromSecretsManager, assignSecretKey } = require('../../lib/helpers/utils.js');
const { getSecretsManagerInstance, getSecretsValues } = require('../../lib/secrets/aws-secrets-manager.js');

jest.mock('../../__mocks__/mock-secret-manager.js');
jest.mock('../../lib/helpers/utils.js');
jest.mock('../../lib/secrets/aws-secrets-manager.js');

describe('Main Secret Manager Test Suite', () => {
    test('should load all secrets frm SecretManager', async () => {
        const opts = {
            awsSdkOptions: {
                region: 'test'
            },
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
                },
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
        assignSecretKey.mockReturnValue(null);

        try {
            const secretsOpts = await secretFecth().init(opts);
        } catch (error) {
            console.log(error)
        }

    })
})