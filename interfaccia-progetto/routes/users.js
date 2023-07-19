const express = require('express');
const { verifyToken } = require('../ver-log');
const userCodes = require('../map');
const router = express.Router();


router.get('/prenotazioni/:username', verifyToken, async function(req, res, next){
  // if(req.body.message){
    console.log('Questo è il messaggio della query')
    console.log(req.body)
  // }
  const utente = req.params.username;
  // console.log('Questi sono i locals')
  // console.log(req)
  // console.log('REQ LOCALS USERCODES', req.app.locals.userCodes.get(user))
  const userToken = userCodes.get(utente);
  const token = userToken.access_token;
  console.log('Token Pole', token);
  // console.log('RES LOCALS USERCODES', res.app)
  const prenotazione = await fetch(`http://archiver:3001/prenotazioni/${utente}`, {
    method: 'POST',
    header: {'Content-Type':'application/x-www-form-urlencoded'},
    body: new URLSearchParams({
      token: token,
    })
  }).then((res) => {/*console.log('Questa è la risposta con le prenotazioni', res);*/ return res.json()})
  .catch((error) => {
    const prenotazioni = []
    const message = 'Impossibile visualizzare le prenotazioni'
    const risposta = ({
      body: {
        message: message,
        prenotazioni: prenotazioni
      }
    })
    return risposta;
  });

  console.log('Queste sono le prenotazioni che arrivano dall\'archiver')
  console.log(prenotazione)
  console.log('Prenotazioni.body')
  console.log(prenotazione.body)

  const prenotazioni = prenotazione.body.prenotazioni;
  const message = prenotazione.body.message;

  console.log('Queste sono le prenotazioni nell\'elenco delle prenotazioni', prenotazioni)

  res.render('prenotazioni', { title: 'Prenotazioni', prenotazioni, message, utente })
});



// CREAZIONE DI UNA PRENOTAZIONE
router.post('/prenotazione', function(req, res, next){
  // console.log('Questa è la request della post')
  // console.log(req);
  const utente = req.body.persona;
  // console.log('Questo è l\'utente', utente)
  // const id_col = req.body.id_colonnina;
  const nome_col = req.body.nome_colonnina;
  // console.log('Questo è la colonnina', nome_col)
  const cerchia = req.body.cerchia;
  // console.log('Questo è la cerchia', cerchia)

  const id_col = req.body.id_colonnina;
  // console.log('ID COL', id_col)
  const userToken = userCodes.get(utente)

  const token = userToken.access_token;

  console.log('Token Diego MirSESO', token)
  
  const ore = new Date().getHours()
  const minuti = new Date().getMinutes();
  // const secondi = new Date().getSeconds();

  const inizio = `${ore}:${minuti}`

  const timestamp = new Date().toJSON();

  let otp = Math.random().toString();
  otp = otp.substring(2,8);

  console.log('Questo è il codice otp generato: ', otp)

  // console.log('Stampo ora di inizio prenotazione')
  // console.log(inizio);

  const prenotazione = fetch('http://archiver:3001/prenotazione', {
    method: 'POST',
    header: {'Content-Type':'application/x-www-form-urlencoded'},
    body: new URLSearchParams({
      id_col: id_col,
      utente: utente,
      nome_col: nome_col,
      inizio: inizio,
      cerchia: cerchia,
      otp: otp,
      iniziotimestamp: timestamp,
      token: token
    })
  })
  // .then((res) => {console.log('Questa è la res nel then'); console.log(res); return res.json()})
  // .then((prntz) => { console.log('Questa è la prenotazione prntz'); console.log(prntz); return prntz.json()})

  // console.log('Questa è la prenotazione')
  // console.log(prenotazione)
  // console.log(prntz);

  // res.send({body: prenotazione});
  res.redirect('/colonnine');
  // res.render('', { title: 'Prenotazioni' })
})



// ELIMINAZIONE DI UNA PRENOTAZIONE
router.post('/elimina-prenotazione', async function(req, res, next){

  const id_prn = req.body.id_prn;
  const nome_prn = req.body.nome_prn;
  const inizio = req.body.inizio;
  const cerchia = req.body.cerchia;
  const utente = req.body.utente;
  const id_col = req.body.id_col;

  const userToken = userCodes.get(utente)

  const token = userToken.access_token;

  const el_prn = await fetch('http://archiver:3001/del-prenotazione', {
    method: 'POST',
    header: {'Content-Type':'application/x-www-form-urlencoded'},
    body: new URLSearchParams({
      id_prn: id_prn,
      nome_prn: nome_prn,
      inizio: inizio,
      cerchia: cerchia,
      utente: utente,
      id_col: id_col,
      token: token
    })
  })
  // .then((ciao) => {console.log('Questo è il corpo della fetch'); console.log(ciao); return ciao.json()}).then((res) => {console.log('Questo è ciao'); console.log(res); return res.body})
  
  res.redirect(`/prenotazioni/${utente}`)
  // res.send({body: el_prn});
})



// PAGINA INFO SINGOLA PRENOTAZIONE
// DECIDERE SE FARE CON ID PRENOTAZIONE NEI PARAMS E FARE UNA GET O FARE UNA POST CHE FA ARRIVARE QUI I DATI
router.post('/info-prenotazione', async function(req, res, next){
  // DATI PRENOTAZIONE CON CODICE OTP E INFO COLONNINA
  console.log('INFO PRENOTAZIONE', req.body)
  const id_prn = req.body.id_prn;
  const nome_prn = req.body.nome_prn;
  const inizio = req.body.inizio;
  const cerchia = req.body.cerchia;
  const utente = req.body.utente;
  const id_col = req.body.id_col;

  const userToken = userCodes.get(utente)
  
  const token = userToken.access_token;

  const prenotazione = await fetch('http://archiver:3001/info-prenotazione', {
    method: 'POST',
    header: {'Content-Type':'application/x-www-form-urlencoded'},
    body: new URLSearchParams({
      id_prn: id_prn,
      nome_prn: nome_prn,
      inizio: inizio,
      cerchia: cerchia,
      utente: utente,
      id_col: id_col,
      token: token
    })
  }).then((res) => {return res.json()})

  // const prenotazione = risposta.body;
  console.log('Questa è la prenotazione post fetch', prenotazione)

  res.render('info-prenotazione', { title: 'Info prenotazione', prenotazione, utente })
})



// LOGOUT
router.get('/logout', async function(req, res, next){
  const username = req.cookies.username;
  const token = userCodes.get(username)
  const accessToken = token.ACCESS_TOKEN;
  const id_token = token.ID_TOKEN; 
  console.log('Access Token', accessToken);
  userCodes.delete(username)
  const tokenOfUser = userCodes.get(username)

  console.log("token dell'utente: ", token )
  console.log("id token ", id_token)
  
  
  // const logoutUser = async (accessToken, id_token) => {
  //   const cognitoEndpoint = 'https://carcharger.auth.eu-north-1.amazoncognito.com/logout?';
  //   const userPoolId = 'eu-north-1_3xHlO3KO2';
  
  //   const response = await fetch(`${cognitoEndpoint}/oauth2/logout`, {
  //     method: 'POST',
  //     headers: {
  //       'Content-Type': 'application/x-www-form-urlencoded',
  //       Authorization: `Bearer ${accessToken}`,
  //     },
  //     body: new URLSearchParams({
  //       token: accessToken,
  //       client_id: '2pvlparps5taordhs5ok5tonp8',
  //       logout_uri: 'https://carcharger.uniupo.click', // Optional
  //     }),
  //   });
  //   console.log('Valore di response', response);
  //   if (response.ok) {
  //     // Logout successful
  //     console.log('User logged out');
  //   } else {
  //     // Logout failed
  //     console.error('Logout failed');
  //   }
  // };
  
  // logoutUser(accessToken, id_token);
  // res.clearCookie('username');


  const client_id = '2pvlparps5taordhs5ok5tonp8';
  const logout_uri = 'https://carcharger.uniupo.click';

  const logoutUser = async () => {
    const cognitoEndpoint = `https://carcharger.auth.eu-north-1.amazoncognito.com/logout?client_id=${client_id}&redirect_uri=${logout_uri}&response_type=code`;
    const userPoolId = 'eu-north-1_3xHlO3KO2';
  
    const response = await fetch(`${cognitoEndpoint}`, {
      method: 'GET',
      // headers: {
      //   'Content-Type': 'application/x-www-form-urlencoded',
      //   // client_id: '2pvlparps5taordhs5ok5tonp8',
      //   Accept: '*/*',
      //   Authorization: `Bearer ${id_token}`,
      //   // id_token: id_token,

      // logout_uri: 'https://carcharger.uniupo.click'
      // },
      // body: new URLSearchParams({
      //   token: accessToken,
      //   client_id: '2pvlparps5taordhs5ok5tonp8',
      //   logout_uri: 'https://carcharger.uniupo.click', // Optional
      // }),
    });
    // console.log('Valore di response', response);
    if (response.ok) {
      // Logout successful
      console.log('User logged out');
      res.status(200).redirect('/');
      // res.redirect('/');
    } else {
      // Logout failed
      console.error('Logout failed');
      res.status(400).redirect('/');
      // res.locals.code = 200;
      // console.log('Valore di statusCode', req.locals.code)
      // res.redirect('/');
    }
  };

  logoutUser();
  res.clearCookie('username');
  res.clearCookie('carcharger');






  
  // client_id = "eu-north-1_3xHlO3KO2",
  // logout_uri = "https://carcharger.uniupo.click/logout"
  // const logout = await fetch(`https://carcharger.auth.eu-north-1.amazoncognito.com/logout?client_id=${client_id}&logout_uri=${logout_uri}/`, {
  //   // redirect_uri: "http://YOUR_APP/redirect_uri&"
  // }).then((res) => {console.log('Questa è la response'); console.log(res)})
})

// router.get('/auth/logout', function(req, res, next){
//   console.log('Request logout');
//   console.log(req);
// })

// colonnina0 - colonnina9

// Struttura tabella prenotazioni
// id_prenotazione
// username
// nome_colonnina
// inizio

module.exports = router;
