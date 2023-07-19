'use strict'

const path = "./jwk/jwk.json";
const { error } = require('console');
const fs = require('fs');

const uri = 'https://cognito-idp.eu-north-1.amazonaws.com/eu-north-1_3xHlO3KO2/.well-known/jwks.json';

exports.getJWK = function(){
    setInterval(async () => {
        const res = await fetch(uri);
        const jwk = await res.json();
        console.log('Questo è JWK', jwk);

        fs.writeFile(path, JSON.stringify(jwk, null, 2), (error) => {
            if(error){
                console.log('Errore', error)
            }
        })
    }, 7*24*60*60*1000);
}