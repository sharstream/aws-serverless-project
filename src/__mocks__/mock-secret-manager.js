'use strict';

const AWS = jest.genMockFromModule('aws-sdk');

const getSecretValue = (secretId, cb) => {
    return {
        $response: { response: 'testing'},
        ARN: 'arn:aws:secretsmanager:test:1:secret:pgCred-vuAvFq',
        Name: 'pgTest',
        SecretString: `{'username': 'test', 'pwd': 'test'}`,
        VersionId: 'fdbc8cda-e510-4757-aa8c-06ab08ca3c61'
    }
}
const SecretManager = (module) => module;
AWS.SecretManager = SecretManager;
AWS.SecretManager = () => {
    getSecretValue: getSecretValue
};

module.exports = AWS;