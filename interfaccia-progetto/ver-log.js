'use strict'
const {CognitoJwtVerifier} = require('aws-jwt-verify')
const fs = require('fs');
const app = require('./app');
const userCodes = require('./map');

const verifier = CognitoJwtVerifier.create({
    userPoolId: process.env.AWS_COGNITO_USERPOOL_ID,
    clientId: process.env.AWS_COGNITO_CLIENT_ID,
    tokenUse: 'access'
});
const jwks = JSON.parse(fs.readFileSync('./jwk/jwk.json'));
verifier.cacheJwks(jwks);


module.exports.verifyToken = async (req, res, next) => {
    const username = req.cookies.username;
    const token = userCodes.get(username);
    let access_token;
    if(token){
        access_token = token.access_token;
    }
    
    
    try{
        const payload = await verifier.verify(access_token);
        res.locals.utente = username;
        next();
    }catch (err){
        res.locals.utente = '';
        next();
    }
}