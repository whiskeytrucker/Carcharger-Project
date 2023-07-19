'use strict'
const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const session = require('express-session');

// JWT COGNITO
const { CognitoJwtVerifier } = require('aws-jwt-verify');

const { verifyToken } = require('./ver-log')

// const aws = require('./aws-jwk');

// const mqtt = require('./mqtt');  // require mqtt
// const client = mqtt.connect('est.mosquitto.org');  // create a client

require('dotenv').config();

const dao = require('./models/dao')

const indexRouter = require('./routes/index');

const usersRouter = require('./routes/users');

const db = require('./db.js');

const userCodes = require('./map');

// VERIFICA JSON WEB TOKEN (JWT)
const verifier = CognitoJwtVerifier.create({
  userPoolId: process.env.AWS_COGNITO_USERPOOL_ID,
  clientId: process.env.AWS_COGNITO_CLIENT_ID,
  tokenUse: 'access'
});

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.locals.utente = '';
app.locals.message = '';
app.locals.message2 = '';

// QUERY ELIMINAZIONE PRENOTAZIONI
// function delPrnScadute(ore, minuti){
//   const risposta = fetch('http://archiver:3001/del-prn-scadute', {
//     method: 'POST',
//     header: {'Content-Type':'application/x-www-form-urlencoded'},
//     body: new URLSearchParams({
//       ore: ore,
//       minuti: minuti
//     })
//     // .then((res) => {return res.json()})
//   })
// }

// ELIMINAZIONE OGNI 5 MINUTI DELLE PRENOTAZIONI "SCADUTE"
// setInterval(function(){
//   const ore = new Date().getHours()
//   const minuti = new Date().getMinutes();
//   delPrnScadute(ore, minuti);
// }, 300000)


setInterval(function(){
  const ore = new Date().getHours()
  const minuti = new Date().getMinutes();
  const risposta = fetch('http://archiver:3001/del-prn-scadute', {
    method: 'POST',
    header: {'Content-Type':'application/x-www-form-urlencoded'},
    body: new URLSearchParams({
      ore: ore,
      minuti: minuti
    })
  }).catch((err) => {
    console.log('Errore nell\'eliminazione', err)
  })
}, 300)


// set up the session
app.use(session({
  //store: new FileStore(), // by default, Passport uses a MemoryStore to keep track of the sessions - if you want to use this, launch nodemon with the option: --ignore sessions/
  secret: 'Il caso non esiste',
  resave: false,
  saveUninitialized: false
}));

// DA USARE PER SALVARE IL VALORE DI LOGGATO
// app.use(function(req, res, next) {
//   res.locals.user = req.session.user;
//   next();
// });

// AUTENTICAZIONE CON COGNITO
app.get('/auth', async function(req, res, next){
  const code = req.query.code;
  console.log(code);

  const token = await fetch('https://carcharger.auth.eu-north-1.amazoncognito.com/oauth2/token', {
    method: 'POST',
    header: {'Content-Type':'application/x-www-form-urlencoded'},
    body: new URLSearchParams({
      "grant_type": "authorization_code",
      "client_id": "2pvlparps5taordhs5ok5tonp8",
      "client_secret":"1fqucudinl81eje691qitmnv3184n8b1oa7hn0svjkee34rrlqa8",
      "code": code,
      "redirect_uri":"https://carcharger.uniupo.click/auth",
    })
  }).then((res) => {return res.json()})

 console.log('Ocean Gate', token)

  const id_token = token.id_token;
  const access_token = token.access_token;
  const refresh_token = token.refresh_token;

 

  // const tokenObjValue = {
  //   ACCESS_TOKEN: access_token,
  //   ID_TOKEN: id_token,
  //   REFRESH_TOKEN: refresh_token
  // }

  //const mapProva = new Map();
  //mapProva.set("ema", tokenObjValue)

  


  const expires_in = token.expires_in;

  // COGNITO RICHIESTA ID UTENTE
  const id_utente = await fetch('https://carcharger.auth.eu-north-1.amazoncognito.com/oauth2/userInfo', {
    method: 'GET',
    headers: {Authorization: `Bearer ${access_token}`}
  }).then((res) => {return res.json()})

  const sub = id_utente.sub;
  const verificato = id_utente.email_verified;
  const email = id_utente.email;
  const nome_utente = id_utente.username;
  
  let randomNumber=Math.random().toString();
  console.log(randomNumber)
  randomNumber=randomNumber.substring(2,randomNumber.length);
  console.log(randomNumber)
  
  // app.locals.userCodes.set(randomNumber, access_token)
  
  // console.log('Questo sono i locals', req.locals);

  //userCodes.set(nome_utente, access_token)
  userCodes.set(nome_utente, token)
  console.log("UserCodes: ", userCodes);
  // res.locals.logged = 'vero';
  // res.session.loggato = true;

  const utente = nome_utente;
  res.locals.utente = nome_utente;
  console.log("res.locals.utente, ", res.locals.utente)
  res.locals.email = email;

  res.cookie('username', utente);
  // con httpOnly: false Funziona
  res.cookie('carcharger', randomNumber/*, { expires: new Date(Date.now() + 7200000 + 1800000), httpOnly: true}*/)// 7200000 = 2hr; 1800000 = 30min; 86400000 = 5hr
  // res.redirect(`/prenotazioni/${nome_utente}`);
  res.redirect('/');
})


// app.post('/isAuth', async function(req, res, next){
//   // console.log(req.body)
//   console.log('Questo è il valore di loggato', req.locals);
//   const utente = req.body.nome_utente;
//   const tokenUser = userCodes.get(utente);

//   try{
//     const payload = await verifier.verify(tokenUser);
//     console.log('Token valido, Payload: ', payload);

//     res.send({
//       body:{
//         utente: utente,
//         loggato: 'true'
//       }
//     })
//     return;
//   }
//   catch(err){
//     console.log('Token non valido', err);

//     res.send({
//       body:{
//         utente: utente,
//         loggato: 'false'
//       }
//     })
//     return;
//   }
// })

// Funzione di controllo se l'utente è loggato
const isLoggedIn = (req, res, next) => {
  if(res.locals.utente !== ''){
    next();
  }
  else{
    console.log('Non sei loggato');
    res.redirect('/login');
  }
}

// app.use(function (req, res, next) {
//   app.locals.utente = '';
//   app.locals.title = '';
//   app.locals.message = '';
//   app.locals.active = '';
//   next();
// });

app.use('/', indexRouter);
app.use('/', isLoggedIn, usersRouter);

// app.get('/', async(req, res) =>{
//   try{
//     db.connect();
//     console.log('Connessione al DB riuscita');
//     const allUser = await db.query('SELECT * FROM test');
//     db.end;
//     console.log('Tutti gli utenti')
//     console.log(allUser.rows[0]);
//     // res.json(allUser.rows);
//     const allUsers = allUser.rows[0];
//     res.render('index', {title: 'Home', allUsers })
//   }catch{
//     console.log('Connessione al DB NON riuscita');
//   }
// })

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
