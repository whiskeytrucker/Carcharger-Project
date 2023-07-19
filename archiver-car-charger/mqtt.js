'use strict'

const mqtt = require('mqtt')

const daoBB = require('./models/daoBBData')
const dao = require('./models/dao')
const fs = require('fs')
const path = require('path')

const url = 'mqtts://carcharger.uniupo.click' // IP macchina virtuale

const KEY = fs.readFileSync(path.join('./mqtt_certs/Client', 'client.key'))
const CERT = fs.readFileSync(path.join('./mqtt_certs/Client/', 'client.crt'))
const TRUSTED_CA_LIST = fs.readFileSync(path.join('./mqtt_certs/Authority/', 'gruppo15CA.crt'))

const CLIENT_ID = 'MQTT_Archiver'


const clientEC2  = mqtt.connect(url,{
    port: '8883',
    clientId: CLIENT_ID,
    key: KEY,
    cert: CERT,
    ca: TRUSTED_CA_LIST,
    rejectUnauthorized: false,
    protocol: 'mqtts'
})


// Connessione del clientEC2 al server con sottoscrizione del clientEC2 al topic
clientEC2.on('connect', () => {
    console.log("connessione con il broker MQTT Archiver stabilita");
    clientEC2.subscribe('event/BB/tempoCarica', console.log());
    clientEC2.subscribe('event/BB/otpSent', console.log());
});


let toSend;
let tpToSend;

// Prende i messaggi dal topic
clientEC2.on('message', (topic, message) => {
    let topicArray =  topic.split('/');

    if(testJSON(message) == false)return


    if(topicArray[topicArray.length - 1] === 'tempoCarica'){
        let messageDict = JSON.parse(message.toString('utf-8'))
        let id_colonnina = messageDict.event[0].id_colonnina
        let tempoCarica = messageDict.event[0].tempoCarica
        let timestamp = messageDict.event[0].timestamp

        let newRow = true

        daoBB.IDColonnine().then((colonnine) => {
            colonnine.forEach((colonnina) => {
                if(colonnina.id == id_colonnina)newRow = false;
            })

             if(newRow == true){daoBB.invioDatiNewCol(id_colonnina, tempoCarica, timestamp)
            }else{daoBB.invioDatiAgg(id_colonnina, tempoCarica, timestamp)}
            
           
            dao.getStato((id_colonnina)).then((stato) => {
                if(stato != 'prenotata'){
                    if(tempoCarica == '0'){dao.setFree(id_colonnina);}
                    else{dao.setBusy(id_colonnina)}
                    
                }
            })
            
        })



    }else if(topicArray[topicArray.length - 1] === 'otpSent'){
        let messageDict = JSON.parse(message.toString('utf8'))
        let id_colonnina = messageDict.event[0].id_colonnina
        let otp = messageDict.event[0].OTP

        let otpResult = false;

        daoBB.prendiOTP().then((prenotazioni) => {
            prenotazioni.forEach((prenotazione) => {
                if(prenotazione.otp == otp && prenotazione.id == id_colonnina){
                    otpResult = true;
                    dao.delPrenotazioneFromId(id_colonnina)
                    return
                }
            })

            tpToSend = 'event/EC2/OTPresult'
            toSend = `{"event":[{"id_colonnina":"${id_colonnina}","otpResult":"${otpResult}"}]}`

            if(otpResult === true)dao.setBusy(id_colonnina);
          
            console.log()
            clientEC2.publish(tpToSend, toSend);
        })

        
    }
});


setInterval(()=>{
    
    dao.getStati().then((stati) => {
        stati.forEach((stato) => {
            tpToSend = 'event/EC2/stato'
            toSend = `{"event":[{"id_colonnina":"${stato.id_col}","stato":"${stato.stato}"}]}`
            clientEC2.publish(tpToSend,toSend)
        })
    }
)},5*1000);


    




function testJSON(message){
    try{
        JSON.parse(message);
        return true
    }catch(error){
        return false
    }
}
