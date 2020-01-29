'use strict';

const testUtil = require('../../../lib/helpers/utils.js');

jest.mock('')

describe('Main Utilities Test Suite', () => {

    const getCurrentDate = () => new Date();
    let realDate;

    afterEach(async () => {
        realDate = Date;
    });

    test('should fetch secrets from SecretsManager', () => {
        //Mock Setup in case all the cases are valid
        const currentDate = new Date('Jan 28, 01 10:54:36');
        realDate = Date;
        global.Date = class extends Date {
            constructor(date) {
                if (date) {
                    return super(date);
                }
                return currentDate;
            }
        };

        expect(testUtil.shouldFetchFromSecretsManager(
            { secretsLoaded: true, secretsLoadedAt: new Date('Jan 28, 01 10:54:36'), cache: false, cacheExpiryInMillis: 1580226854306 }
        )).toBeTruthy();
        expect(testUtil.shouldFetchFromSecretsManager(
            { secretsLoaded: true, secretsLoadedAt: new Date('Jan 28, 01 10:54:36'), cache: true, cacheExpiryInMillis: 1580162334644 }
        )).toBeFalsy();
        
        expect(getCurrentDate()).toEqual(new Date('Jan 28, 01 10:54:36'));
        
        expect(testUtil.shouldFetchFromSecretsManager(
            { secretsLoaded: true, secretsLoadedAt: new Date('Jan 28, 01 10:54:36'), cache: true, cacheExpiryInMillis: 1580226854006 }
        )).toBeFalsy();

        // Cleanup Mock Date
        global.Date = realDate;
    });
});