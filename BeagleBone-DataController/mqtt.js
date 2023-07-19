'use strict'

const mqtt = require('mqtt')  // require mqtt
const fs = require('fs')
const path = require('path')

const urlBB = '127.0.0.1'
const urlEC2 = 'mqtt://carcharger.uniupo.click'

const KEY = fs.readFileSync(path.join('/home/debian/gruppo15Certs/Client/', 'client.key'))
const CERT = fs.readFileSync(path.join('/home/debian/gruppo15Certs/Client/', 'client.crt'))
const TRUSTED_CA_LIST = fs.readFileSync(path.join('/home/debian/gruppo15Certs/Authority/', 'gruppo15CA.crt'))

const CLIENT_ID = 'MQTT_BeagleBone'

const clientBB  = mqtt.connect(urlBB, {
    port: '8883',
    clientId: CLIENT_ID,
    key: KEY,
    cert: CERT,
    ca: TRUSTED_CA_LIST,
    rejectUnauthorized: false,
    protocol: 'mqtts'
}) 

const clientEC2 = mqtt.connect(urlEC2, {
    port: '8883',
    clientId: CLIENT_ID,
    key: KEY,
    cert: CERT,
    ca: TRUSTED_CA_LIST,
    rejectUnauthorized: false,
    protocol: 'mqtts'
})


// Connessione del clientBB al server con sottoscrizione del clientBB al topic
clientBB.on('connect', () => {
    console.log("connessione con il broker MQTT della Beaglebone stabilita");
    clientBB.subscribe('event/+/+/+/dati', console.log());
    clientBB.subscribe('event/+/+/otp', console.log())
});


clientEC2.on('connect', () => {
    console.log("connessione con il broker MQTT della macchina virtuale stabilita");
    clientEC2.subscribe('event/EC2/OTPresult', console.log())
    clientEC2.subscribe('event/EC2/stato', console.log())
});

let toSend;
let tpToSend;

clientBB.on('message', (topic, message) => {
    //console.log(`Message: ${message}\tTopic: ${topic}`)
    tpToSend = topic
    let topicArray =  topic.split('/');

    if(testJSON(message) == false)return

    if(topicArray[topicArray.length - 1] === 'dati'){

        let id_colonnina = topicArray[1]
        let messageDict = JSON.parse(message.toString('utf8'))
        let stato = "libera"
        let valCorr = messageDict.event[0].corrente     // 0.0336 A
        let capacita = messageDict.event[0].capacita      //  30-50 kWhr
        let perc = messageDict.event[0].percentuale     // 0-100
        let tensione = 220
        
        let tempoCarica = 0;

        if(valCorr != null && capacita != null && perc != null){
            if(valCorr != 0 && perc != 0 && capacita != 0){
                console.log(`ValCorr: ${valCorr}\tPerc:${perc}`)
                let kWhrPassing = valCorr * tensione    // in kWhr
                kWhrPassing = kWhrPassing.toFixed(2)
                let capCurr = capacita*(perc/100)       // 80% della capacita max in kWhr
                let diff = Math.ceil(((capacita*0.8) - capCurr))  // in kWhr
    
                if(diff > 0){
                    tempoCarica = Math.ceil((diff/kWhrPassing)*60)  // in minuti
                }else{
                    tempoCarica = 0;
                }
            }
        }

        let timestamp = new Date()
        timestamp.setHours(timestamp.getHours() + 2)      // +2 perche fuso orario
        timestamp = timestamp.toJSON()

        if(tempoCarica > 0)stato = "occupata"
        else stato = "libera"
        
        tpToSend = 'event/BB/tempoCarica'
        toSend = `{"event":[{"id_colonnina":${id_colonnina},"timestamp":"${timestamp}","stato":"${stato}","tempoCarica":${tempoCarica}}]}`
    }
    
    if(topicArray[topicArray.length - 1] === 'otp'){
        let messageDict = JSON.parse(message.toString('utf8'))
        let id_colonnina = topicArray[1]
        let otp = messageDict.event[0].OTP

        tpToSend = 'event/BB/otpSent'
        toSend = `{"event":[{"id_colonnina":${id_colonnina},"OTP":${otp}}]}`
    }

    clientEC2.publish(tpToSend, toSend)

})




// lettura messaggi da EC2
clientEC2.on('message', (topic, message) => {
    //console.log(`Topic: ${topic}\tMessage: ${message}`)
    let topicArray =  topic.split('/');

    if(testJSON(message) == false)return

    if(topicArray[topicArray.length - 1] === 'stato'){
        let messageDict = JSON.parse(message.toString('utf-8'))

        let id = messageDict.event[0].id_colonnina
        let stato = messageDict.event[0].stato

        tpToSend = `event/${id}/stato`
        toSend = `{"event":[{"stato":"${stato}"}]}`

        
    
    }else if(topicArray[topicArray.length - 1] === 'OTPresult'){
        //console.log(`Message: ${message}\tTopic: ${topic}`)
        let messageDict = JSON.parse(message.toString('utf-8'))

        let id = messageDict.event[0].id_colonnina
        let risultato = messageDict.event[0].otpResult

        tpToSend = `event/${id}/OTPresult`
        toSend = `{"event":[{"otpResult":"${risultato}"}]}`

        

    }

    clientBB.publish(tpToSend, toSend)

})



function testJSON(message){
    try{
        JSON.parse(message);
        return true
    }catch(error){
        return false
    }
}
