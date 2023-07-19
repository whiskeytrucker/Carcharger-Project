'use strict'

const mqtt = require('mqtt')  // require mqtt
// const client = mqtt.connect('est.mosquitto.org')  // create a client

const client  = mqtt.connect('mqtt://13.50.100.141') // IP macchina virtuale

// Connessione del client al server con sottoscrizione del client al topic
client.on('connect', () => {
    console.log("connessione con il broker MQTT stabilita");
    client.subscribe('b2/ciao', console.log);
});

// Prende i messaggi dal topic
client.on('message', (topic, message) => {
    // Si possono fare delle query al db e si può gestire il messaggio
    console.log(`message: ${message}, topic: ${topic}`);
});

// Per pubblicare sul topic
client.on('connect', () => {
    client.publish('b2/ciao', 'ciao da Vscode')
})


module.exports = mqtt;


// client.on('connect', function () {
//     console.log('Connessione')
//     client.subscribe('presence', function (err) {
//     if (!err) {
//         console.log('Errore connessione')
//         client.publish('presence', 'Hello mqtt')
//     }
//     console.log('Connesso')
//   })
// })

// client.on('message', function (topic, message) {
//   // message is Buffer
//   console.log(message.toString())
//   client.end()
// })