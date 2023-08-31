const express = require('express');
const { verifyToken } = require('../ver-log');
const userCodes = require('../map');
const router = express.Router();


router.get('/prenotazioni/:username', verifyToken, async function(req, res, next){
  const utente = req.params.username;
  const userToken = userCodes.get(utente);
  const token = userToken.access_token;

  const prenotazione = await fetch(`http://archiver:3001/prenotazioni/${utente}`, {
    method: 'POST',
    header: {'Content-Type':'application/x-www-form-urlencoded'},
    body: new URLSearchParams({
      token: token,
    })
  }).then((res) => { return res.json() })
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

  const prenotazioni = prenotazione.body.prenotazioni;
  const message = prenotazione.body.message;

  res.render('prenotazioni', { title: 'Prenotazioni', prenotazioni, message, utente })
});



// CREAZIONE DI UNA PRENOTAZIONE
router.post('/prenotazione', function(req, res, next){
  const utente = req.body.persona;
  const nome_col = req.body.nome_colonnina;
  const cerchia = req.body.cerchia;

  const id_col = req.body.id_colonnina;
  const userToken = userCodes.get(utente)

  const token = userToken.access_token;

  const ore = new Date().getHours()
  const minuti = new Date().getMinutes();

  const inizio = `${ore}:${minuti}`

  const timestamp = new Date().toJSON();

  let otp = Math.random().toString();
  otp = otp.substring(2,8);

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
  res.redirect('/colonnine');
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
  res.redirect(`/prenotazioni/${utente}`)
})



// PAGINA INFO SINGOLA PRENOTAZIONE
router.post('/info-prenotazione', async function(req, res, next){
  // DATI PRENOTAZIONE CON CODICE OTP E INFO COLONNINA
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

  res.render('info-prenotazione', { title: 'Info prenotazione', prenotazione, utente })
})



// LOGOUT
router.get('/logout', async function(req, res, next){
  const username = req.cookies.username;
  const token = userCodes.get(username)
  const accessToken = token.ACCESS_TOKEN;
  const id_token = token.ID_TOKEN; 
  userCodes.delete(username)
  const tokenOfUser = userCodes.get(username)
  
  const client_id = '2pvlparps5taordhs5ok5tonp8';
  const logout_uri = 'https://carcharger.uniupo.click';

  const logoutUser = async () => {
    const cognitoEndpoint = `https://carcharger.auth.eu-north-1.amazoncognito.com/logout?client_id=${client_id}&redirect_uri=${logout_uri}&response_type=code`;
    const userPoolId = 'eu-north-1_3xHlO3KO2';
  
    const response = await fetch(`${cognitoEndpoint}`, {
      method: 'GET',
    });
    if (response.ok) {
      // Logout successful
      console.log('User logged out');
      res.status(200).redirect('/');
    } else {
      // Logout failed
      console.error('Logout failed');
      res.status(400).redirect('/');
    }
  };

  logoutUser();
  res.clearCookie('username');
  res.clearCookie('carcharger');
})

module.exports = router;
