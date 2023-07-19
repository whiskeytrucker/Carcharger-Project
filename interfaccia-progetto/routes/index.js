const express = require('express');
const router = express.Router();
const dao = require('../models/dao.js');
const cors = require('cors');
const { verifyToken } = require('../ver-log.js');



// SCHERMATA PRINCIPALE CON LA MAPPA
router.get('/', cors(), verifyToken, async function(req, res, next){
  // console.log('Valore della res locals', res.locals);
  // console.log('Valore della req locals', req.locals);
  // console.log('Valore di req.session per logout cognito', req.session);
  // console.log('Questa è la request fatto il login')
  // console.log(req.headers.cookie);
  // console.log('Valore di locals loggato', res.locals.utente);
  const utente = res.locals.utente;
  // if(req.cookies){
  //   // console.log('Questo è il cookie', req.cookies.carcharger)
  //   console.log('Cookie username', req.cookies.username)
  //   console.log('Questo è il body con le info', req.body)
  //   const nome_utente = req.cookies.username;
  //   console.log('Nome utente prima della fetch', nome_utente)
  //   const verifica = await fetch('http://progetto-reti-2:3000/isAuth', {
  //     method: 'POST',
  //     header: {'Content-Type':'application/x-www-form-urlencoded'},
  //     body: new URLSearchParams({
  //       nome_utente: nome_utente
  //     })
  //   }).then((res) => {return res.json()})
  //   .catch((error) => {
  //     // DA CAMBIARE
  //     console.log(error);
  //   })
  //   console.log('Questa è la verifica', verifica);
  //   console.log('Valore di loggato', verifica.body.loggato);
  //   req.session.loggato = verifica.loggato;
  // }
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
  
  console.log('Questa è la risposta per le mappe');
  console.log(risposta);
  const mappa = risposta.body.chargers;
  console.log(typeof(mappa));
  let message = risposta.body.message;
  console.log('Questo è il messaggio ', message)
  // mappa.forEach((mappa1) => {
    // console.log('Questo è mappa1: ', mappa1)
  // })
  // res.locals.mappa = mappa;
  // localStorage.setItem('mappa', JSON.stringify(mappa));
  // utente = req.session.loggato;
  res.render('index', { title: 'Home', mappa, message, utente })
})


// router.get('/', function(req, res, next) {
//   // dao.getTest().then((test) => {
//     res.render('index', { title: 'Home' })
//   // })
// });

router.get('/colonnine', verifyToken, async function(req, res, next){
  // console.log('Questo è il valore di loggato', req.locals)
  const utente = res.locals.utente;
  console.log('Utente', utente)
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
  
  console.log('Questa è la risposta');
  console.log(risposta);
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
  }).then((res) => {console.log('Questa è la response', res); return res.json()})
  // .catch((error) => {
  //   const chargers = []
  //   const message = 'Impossibile visualizzare le colonnine'
  //   const risposta = ({
  //     body: {
  //       message: message,
  //       chargers: chargers
  //     }
  //   })
  //   return risposta;
  // });

  const colonnina = risposta.body;
  console.log('Questa è la colonnina prima del render', colonnina)

  // Manca la generazione e la stampa del codice otp
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
