'use strict';

const AWSMock = require('aws-sdk-mock');
const AWS = require('aws-sdk');
const { createSecret, getSecretsValues } = require('../../../lib/secrets/aws-secrets-manager.js');

jest.mock('../../../__mocks__/mock-secret-manager.js');

describe('Helpers Utilities SecretManager Test Suite', () => {
    let param;
    beforeEach(async() => {
        param = {
            name: 'test',
            description: 'this is a test',
            value: { pgTest: { host: 'test'}}
        };
    });

    afterEach(async () => {
        AWSMock.restore('SecretsManager');
    })

    test('should creates a new secret', async () => {
        //Mock Setup
        AWSMock.setSDKInstance(AWS);
        AWSMock.mock('SecretsManager', 'createSecret', function (params, callback){
            callback(null, { success: {secret: 'test'}});
        });

        const secretsManagerInstance = new AWS.SecretsManager({region: 'fake1'});
        try {
            const res = await createSecret(secretsManagerInstance, param);
            expect(res).toEqual({"success": {"success": {"secret": "test"}}})
        } catch (error) {
            expect(error).toBeFalsy()
        }
    });

    test('should fails because invalid parameter type', async () => {
        //Mock Setup
        AWSMock.setSDKInstance(AWS);
        AWSMock.mock('SecretsManager', 'createSecret', function (params, callback){
            callback(new Error('InvalidParamterType'), { error: { code: 'InvalidParamterType'}});
        });

        const secretsManagerInstance = new AWS.SecretsManager({region: 'fake2'});
        try {
            const res = await utilSecret.createSecret(param, secretsManagerInstance);
        } catch (error) {
            expect(error).toBeTruthy();
        }
    });

    test('should get all secrets from SecretManager individually', async () => {
        //Mock Setup
        const options = {
            secrets: ['test']
        }
        AWSMock.setSDKInstance(AWS);
        AWSMock.mock('SecretsManager', 'getSecretValue', function (params, callback){
            callback(null, {
                response: 'testing',
                ARN: 'arn:aws:secretsmanager:test:1:secret:pgCred-vuAvFq',
                Name: 'test',
                SecretString: '{ "pgCred": {"username":"test", "password":"test"} }',
                VersionId: 'fdbc8cda-e510-4757-aa8c-06ab08ca3c61'
            });
        });

        const secretsManagerInstance = new AWS.SecretsManager({region: 'fake1'});

        try {
            const secrets = await getSecretsValues(secretsManagerInstance, options.secrets);
            expect(secrets).toEqual([{"test": {"isExpired": false, "pgCred": {"password": "test", "username": "test"}}}])
        } catch (error) {
            expect(error).toBeFalsy();
        }
    });

    test('should fails because invalid secret parameter type', async () => {
        //Mock Setup
        const options = {
            secrets: ['test']
        }
        AWSMock.setSDKInstance(AWS);
        AWSMock.mock('SecretsManager', 'getSecretValue', function (params, callback){
            callback(new Error('InvalidParamterType'), { error: { code: 'InvalidParamterType'}});
        });

        const secretsManagerInstance = new AWS.SecretsManager({region: 'fake1'});

        try {
            const secrets = await getSecretsValues(secretsManagerInstance, options.secrets);
        } catch (error) {
            expect(error).toBeTruthy();
            expect(error.message).toBe('Something went wrong with HTTP Secret Manager request');
        }
    });
});