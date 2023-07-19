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

console.log('Valore della map:', userCodes)

module.exports.verifyToken = async (req, res, next) => {
    // console.log('Valore di cookie', req.cookies);
    const username = req.cookies.username;
    // const token = req.body.token;
    const token = userCodes.get(username);
    console.log("token in JWT",token);
    //const id_token = token.ID_TOKEN;
    let access_token;
    if(token){
        access_token = token.access_token;
        console.log("access_token", access_token)
    }
    
    
    try{
        const payload = await verifier.verify(access_token);
        console.log("Token valido, Payload: ", payload);
        console.log('UserCodes map', userCodes)
        res.locals.utente = username;
        next();
    }catch (err){
        console.log("Token non valido: ", err);
        res.locals.utente = '';
        // res.status(401).json({error: "Token non valido"})
        next();
    }
}