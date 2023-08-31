const express = require('express');
const router = express.Router();
const dao = require('../models/dao');
const cors = require('cors');

// JWT COGNITO
const { CognitoJwtVerifier } = require('aws-jwt-verify');

// Lettura e scrittura file
const fs = require('fs');

// const aws = require('./aws-jwk');

// VERIFICA JSON WEB TOKEN (JWT)
const verifier = CognitoJwtVerifier.create({
  userPoolId: process.env.AWS_COGNITO_USERPOOL_ID,
  clientId: process.env.AWS_COGNITO_CLIENT_ID,
  tokenUse: 'access'
});

const jwks = JSON.parse(fs.readFileSync('./jwk/jwk.json'));
verifier.cacheJwks(jwks);


/* GET home page. */
router.get('/', cors(), function(req, res, next){
  dao.getAllChargers().then((chargers) => {
    if(chargers === ''){
      chargers = [];
      const message = 'Impossibile visualizzare le colonnine';
      res.send({body: {
        message: message,
        chargers: chargers
      }})
      return;
    }
    res.send({body: {
      chargers: chargers,
      message: ''
    }});
    return;
  })
})

// RESTITUISCO TUTTE LE COLONNINE
router.get('/colonnine', function(req, res, next){
  dao.getAllChargers().then((chargers) => {
    if(chargers === ''){
      chargers = [];
      const message = 'Impossibile visualizzare le colonnine';
      res.send({body: {
        message: message,
        chargers: chargers
      }})
      return;
    }
    res.send({body: {
      chargers: chargers,
      message: ''
    }});
    return;
  })
})

// RESTITUISCO LE INFO DI UNA SOLA COLONNINA AVENDO L'ID
router.post('/colonnina', function(req, res, next){
  const id_col = req.body.id_col;
  dao.getOneCharger(id_col).then((charger) => {
    res.send({body: charger})
  })
})

// LISTA DELLE PRENOTAZIONI DELL'UTENTE PER LA PAGINA PRENOTAZIONI
router.post('/prenotazioni/:username', async function(req, res, next){
  const utente = req.params.username;
  const token = req.body.token;
  try{
    const payload = await verifier.verify(token);

    dao.getReservations(utente).then((prenotazioni) => {
      res.send({body:{
        prenotazioni: prenotazioni}})
    })
  }
  catch(err){
    res.sendStatus(400);
  }
})

// INSERIMENTO NUOVA PRENOTAZIONE
router.post('/prenotazione', async function(req, res, next){

  const utente = req.body.utente;
  const nome_col = req.body.nome_col;
  const inizio = req.body.inizio;
  const cerchia = req.body.cerchia;
  const id_col = req.body.id_col;
  const otp = req.body.otp;
  const iniziotimestamp = req.body.iniziotimestamp;

  const token = req.body.token;

  try{
    const payload = await verifier.verify(token);
    dao.putReservation(id_col, utente, nome_col, inizio, cerchia, otp, iniziotimestamp).then(() => {
      dao.setWaiting(id_col).then((message) => {
        console.log('Messaggio');
        console.log(message);
      })
    })
  }
  catch(err){
    console.log('Token non valido', err)
    res.status(400);
  }
})


// ELIMINAZIONE PRENOTAZIONE
router.post('/del-prenotazione', async function(req, res, next){

  const id_prn = req.body.id_prn;
  const nome_prn = req.body.nome_prn;
  const inizio = req.body.inizio;
  const cerchia = req.body.cerchia;
  const utente = req.body.utente;
  const id_col = req.body.id_col;

  const token = req.body.token;
  try{
    const payload = await verifier.verify(token);
    console.log('Token valido, Payload: ', payload)
    dao.delPrenotazione(id_prn, utente, nome_prn, inizio, cerchia, id_col).then((messaggio) => {
      dao.setFree(id_col).then((message) => {
        res.send({body: message})
      })
    })
  }
  catch(err){
    console.log('Token non valido', err)
    res.status(400);
  }

})


// ELIMINAZIONE PRENOTAZIONI SCADUTE
router.post('/del-prn-scadute', function(req, res, next){
  dao.getPrnScadute().then((colonnine_scadute) => {
    if(colonnine_scadute !== ''){
      colonnine_scadute.forEach((colonnina_scaduta) => {
        const id_col = colonnina_scaduta.id_col;
        dao.setFreeScadute(id_col)
      })
    }
  })
  .finally(() => {
    dao.delPrnScadute().then((message) => {
      res.send({body: message})
    })
  })
})


// PAGINA INFO SINGOLA PRENOTAZIONE
router.post('/info-prenotazione', async function(req, res, next){
  const id_prn = req.body.id_prn;
  const nome_prn = req.body.nome_prn;
  const inizio = req.body.inizio;
  const cerchia = req.body.cerchia;
  const username = req.body.utente;
  const id_col = req.body.id_col;

  const token = req.body.token;
  try{
    const payload = await verifier.verify(token);
    console.log('Token valido, Payload: ', payload)
    dao.getInfoReservation(id_prn, nome_prn, inizio, cerchia, username, id_col).then((prenotazione) => {
      res.send(prenotazione);
    })
  }
  catch(err){
    console.log('Token non valido', err)
    res.status(400);
  }
})


module.exports = router;
