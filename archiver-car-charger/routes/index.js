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
  // res.sendStatus(200)
  // console.log('Questa è la request');
  // console.log(req);

  // const prova = fetch('indirizzo', {
  //   method: 'GET',
  //   header: {'Content-Type':'application/x-www-form-urlencoded'},
  //   // body: 'ciao'
  // })
  console.log('Home dell\'archiver')
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
    console.log('Commentato stampa colonnine piene in:\t Riga 47 index.js archiver-car-charger')
    //console.log('Queste sono le colonnine piene', chargers);
    res.send({body: {
      chargers: chargers,
      message: ''
    }});
    return;
  })
})

// router.get('/charge-time', function(req, res, next){
//   dao.getChargeTime().then((charge_time) => {
//     res.send({body: charge_time})
//   })
// })

// router.get('/chargers', function(req, res, next){
//   dao.getAllChargers().then((chargers) => {
//     fetch('http://localhost:8080', {
//       method: 'POST',
//       header: {'Content-Type':'application/x-www-form-urlencoded'},
//       body: 'ciao'
//       // body: new URLSearchParams({
//       //   "grant_type": "authorization_code",
//       //   "client_id": "2pvlparps5taordhs5ok5tonp8",
//       //   "client_secret":"1fqucudinl81eje691qitmnv3184n8b1oa7hn0svjkee34rrlqa8",
//       //   "code": code,
//       //   "redirect_uri":"http://localhost:8080/auth",
//       // })
//     }).then((res) => {return res.json()})
//   })
// })

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
    // console.log('Queste sono le colonnine piene', chargers);
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
  console.log('Questo è l\'id della colonnina che arriva dalla fetch', id_col)
  dao.getOneCharger(id_col).then((charger) => {
    console.log('Questi sono i charger dopo la query al db', charger)
    res.send({body: charger})
  })
})

// LISTA DELLE PRENOTAZIONI DELL'UTENTE PER LA PAGINA PRENOTAZIONI
router.post('/prenotazioni/:username', async function(req, res, next){
  // console.log('Questo è il body che arriva per la prenotazione')
  // console.log(req)
  const utente = req.params.username;
  console.log(utente)
  const token = req.body.token;
  console.log('Madonna Token', token)
  try{
    const payload = await verifier.verify(token);
    console.log('Token valido, Payload: ', payload)

    dao.getReservations(utente).then((prenotazioni) => {
      // const prenotazioni = fetch('http://localhost:8080', {
      //   method: 'POST',
      //   header: {'Content-Type':'application/x-www-form-urlencoded'},
      // }).then((res) => {return res.json()})
  
      console.log('Queste sono le prenotazioni prese con la query')
      console.log(prenotazioni)
      res.send({body:{
        prenotazioni: prenotazioni}})
    })
  }
  catch(err){
    console.log('Token non valido', err)
    res.sendStatus(400);
  }
})

// INSERIMENTO NUOVA PRENOTAZIONE
router.post('/prenotazione', async function(req, res, next){
  console.log('Questa è la request nella route prenotazione')
  console.log(req.body)

  const utente = req.body.utente;
  const nome_col = req.body.nome_col;
  const inizio = req.body.inizio;
  const cerchia = req.body.cerchia;
  const id_col = req.body.id_col;
  const otp = req.body.otp;
  const iniziotimestamp = req.body.iniziotimestamp;

  const token = req.body.token;
  console.log('Valore di token')
  console.log(token)
  try{
    const payload = await verifier.verify(token);
    console.log('Token valido, Payload: ', payload)
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


  // res.redirect('http://localhost:8080/chi-siamo');
})


// ELIMINAZIONE PRENOTAZIONE
router.post('/del-prenotazione', async function(req, res, next){
  console.log('Questi sono i dati che arrivano dall\'interfaccia')
  console.log(req.body)

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
      console.log('MESSAGGIO ELIMINAZIONE', messaggio)
      dao.setFree(id_col).then((message) => {
        console.log('Questo è il messaggio che restituisce la query di eliminazione')
        console.log(message)
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
      console.log('Colonnine scadute ', colonnine_scadute)
      colonnine_scadute.forEach((colonnina_scaduta) => {
        const id_col = colonnina_scaduta.id_col;
        console.log('Id_col ', id_col);
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
  console.log('Body ', req.body)
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
      console.log('Prenotazione ', prenotazione)
      res.send(prenotazione);
    })
  }
  catch(err){
    console.log('Token non valido', err)
    res.status(400);
  }
})


module.exports = router;
