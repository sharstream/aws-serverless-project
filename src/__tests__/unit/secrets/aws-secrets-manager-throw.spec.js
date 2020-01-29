'use strict';

const secretManagerTester = require('../../../lib/secrets/index.js');
const { shouldFetchFromSecretsManager, checkAllExpiredSecrets } = require('../../../lib/helpers/utils.js');

jest.setTimeout(10000);

describe('Secondary Main SecretManager Throw Suites', () => {
    let opts, originalTimeout;
    beforeEach(async() => {
        // set jest timeout
        originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
        jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;
        // end set jest timeout
        opts = {
            awsSdkOptions: {
                region: 'us-west-2'
            },
            cache: true,
            cacheExpiryInMillis: Math.floor(Date.now() + 5 * 60000),
            secrets: ['gisdb_ma', 'gisdb_maps', 'datadb_ma', 'datadb_maps', 'iotdb_ma', 'iotdb_maps', 'terraligndb_maps', 'activationsdb_gm']
        }
    });

    afterEach( () => {
        jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
    });

    test('should fails to fetch some secrets', async () => {
        try {
            await secretManagerTester({ throwOnFailedCall: 1, secretsCache: [{ test: { host: 'testHost', isExpired: false }}] }).init();
        } catch (error) {
            expect(error.message).toBe('there is temporary problems with Secrets Manager.');
        }
    });

    test('should fetch from some secrets', async () => {
        let should;
        try {
            should = shouldFetchFromSecretsManager({ secretsLoaded: true, secretsLoadedAt: new Date('Mon, 27 Jan 2020 21:42:51 GMT'), cache: true, cacheExpiryInMillis: 1579838261431 });
            expect(should).toBeTruthy();
        } catch (error) {
            expect(should).toBeFalsy();
            expect(error.message).toBe('there is temporary problems with Secrets Manager.');
        }
    });

    test('should check for expired or no expired secrets', () => {
        const secrets = [
            { pgCred : { isExpired: false }},
            { gisCred: { isExpired: false }}
        ]
        const noExpires = checkAllExpiredSecrets(secrets, 2, 1);
        const expires = checkAllExpiredSecrets(secrets, 1, 2);
        expect(noExpires).toBeDefined();
        expect(expires).toBeDefined();
    });
});