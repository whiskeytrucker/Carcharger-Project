const express = require('express');
const router = express.Router();
const dao = require('../models/dao.js');
const cors = require('cors');
const { verifyToken } = require('../ver-log.js');



// SCHERMATA PRINCIPALE CON LA MAPPA
router.get('/', cors(), verifyToken, async function(req, res, next){
  const utente = res.locals.utente;

  const risposta = await fetch('http://archiver:3001', {
    method: 'GET',
    header: {'Content-Type':'application/x-www-form-urlencoded'},
  }).then((res) => {return res.json()})
  .catch((error) => {
    const chargers = []
    const message = 'Impossibile visualizzare le colonnine'
    const risposta = ({
      body: {
        message: message,
        chargers: chargers
      }
    })
    return risposta;
  });
  
  const mappa = risposta.body.chargers;
  let message = risposta.body.message;

  res.render('index', { title: 'Home', mappa, message, utente })
})

router.get('/colonnine', verifyToken, async function(req, res, next){
  
  const utente = res.locals.utente;

  const risposta = await fetch('http://archiver:3001/colonnine', {
    method: 'GET',
    header: {'Content-Type':'application/x-www-form-urlencoded'},
  }).then((res) => {return res.json()})
  .catch((error) => {
    const chargers = []
    const message = 'Impossibile visualizzare le colonnine'
    const risposta = ({
      body: {
        message: message,
        chargers: chargers
      }
    })
    return risposta;
  });
  
  const colonnine = risposta.body.chargers;
  const message = risposta.body.message;
  res.render('colonnine', { title: 'Colonnine', colonnine, message, utente })
});


// PAGINA INFO SINGOLA COLONNINA
router.get('/colonnina/:id_col', verifyToken, async function(req, res, next){
  const utente = res.locals.utente;
  const id_col = req.params.id_col;

  const risposta = await fetch('http://archiver:3001/colonnina', {
    method: 'POST',
    header: {'Content-Type':'application/x-www-form-urlencoded'},
    body: new URLSearchParams({
      id_col: id_col
    })
  }).then((res) => { return res.json() })

  const colonnina = risposta.body;

  res.render('colonnina', { title: 'Colonnina', colonnina, utente })
})

router.get('/prenotazioni', function(req, res, next){
  res.redirect('/login');
})

// PAGINA GRUPPO PROGETTO
router.get('/chi-siamo', verifyToken, function(req, res, next){
  const utente = res.locals.utente;
  res.render('chi-siamo', { title: 'Chi Siamo', utente })
});

// PAGINA LOGIN CHE REINDIRIZZA A COGNITO
router.get('/login', function(req, res, next) {
  res.redirect('https://carcharger.auth.eu-north-1.amazoncognito.com/login?client_id=2pvlparps5taordhs5ok5tonp8&response_type=code&scope=email+openid&redirect_uri=https://carcharger.uniupo.click/auth')
});

module.exports = router;
