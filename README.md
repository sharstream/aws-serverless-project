# aws-secrets-manager

NPM module that utilizes the AWS secrets manager to gather secrets and temporarily store them.

For more details, navigate to Database Parameters-secrets Documentation

## Setup

In your app, install the following:

```
npm i aws-secrets-manager --save

```

Then :

```
//install the dependency
const  SecretManager  =  require("aws-secrets-manager");

//setup the options (all required)

let  opts  = {
	awsSdkOptions:  { region:  "us-east-1" },
	secrets: ['etc'],
	throwOnFailedCall: true || false,
	cacheExpiryInMillis (ttl): Math.floor(Date.now() + 5 * 60000) //store secret for given TTL (default 5 minutes)
};
```

### Properties

| PARAM   |      TYPE      |  DESCRIPTION | DEFAULT |
|----------|:-------------:|:------|:-----------|
| region |  `String` |You must specify a aws region. | ```'us-west-2'``` |
| secrets | `Array<String>`|You must specify the secret names |`e.g. [ 'etc', ... ]` |
| cache | `boolean` |A simple but flexible caching layer. If caching is ON, and cache expiration is ON, and enough time has passed, then also load it from SecretsManager | `false`|
| secretsCache | `Array<Object{}>` |Fetches parameters from AWS Secrets Manager |```JSON { etc: {key: value} } }``` |
| secretsLoadedAt | `Int` |If caching is OFF, or we haven't loaded anything yet, then definitely load it from SecretsManager |`1579822343`|
| TTL | `Int` |TTL will check in at least every 5 minutes to retrieve the latest secrets |`1579822359`|

### Publish TODO
```
npm version <newversion>
git push --follow-tags
```

This will publish your package to NPM registry. 

If you want to make changes to your package, you have to change the version number and publish again.

Remember to use npm commands  `npm version patch`,  `npm version minor`  and  `npm version major`  to update the version automatically rather than manually updating them. These commands are based on  [semantic versioning](https://docs.npmjs.com/getting-started/semantic-versioning).