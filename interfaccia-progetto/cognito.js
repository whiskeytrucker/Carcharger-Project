'use strict'

const AWS = require('aws-sdk');
const AmazonCognitoIdentity = require('amazon-cognito-identity-js');

AWS.config.update({ region: 'your-region' });

const poolData = {
  UserPoolId: 'your-user-pool-id',
  ClientId: 'your-app-client-id'
};

const userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);