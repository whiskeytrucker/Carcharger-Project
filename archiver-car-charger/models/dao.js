'use strict'

const client = require('../db.js');

exports.getAllChargers = function(){
    return new Promise((resolve, reject) => {
        const sql = 'SELECT colonnine.*, dati_colonnine.* FROM colonnine LEFT JOIN dati_colonnine ON id_colonnina = id_col ORDER BY id_colonnina ASC LIMIT 10'
        client.query(sql, (err, row) => {
            if(err){
                const chargers = '';
                resolve(chargers);
                return;
            }

            const chargers = row.rows.map((e) => ({ 
                id_colonnina: e.id_colonnina, 
                nome_luogo: e.nome_luogo,
                cerchia: e.cerchia,
                lng: e.LONG_X_4326,
                lat: e.LAT_Y_4326,
                stato: e.stato,
                tempo: e.tempo_carica
            }));

            resolve(chargers);
        })
    })
}

exports.getOneCharger = function(id_col){
    return new Promise((resolve, reject) => {
        const sql = 'SELECT colonnine.*, dati_colonnine.tempo_carica FROM colonnine JOIN dati_colonnine ON colonnine.id_colonnina = dati_colonnine.id_col WHERE id_colonnina = $1'
        client.query(sql, [id_col], (err, row) => {
            if(err){
                const chargers = '';
                resolve(chargers);
                return;
            }
            const colonnina = row.rows.map((e) => ({
                id_colonnina: e.id_colonnina, 
                nome_luogo: e.nome_luogo,
                cerchia: e.cerchia,
                ambito: e.ambito_nome,
                titolare: e.titolare,
                localita: e.localita,
                infra: e.infra,
                anno: e.anno,
                stato: e.stato,
                tempo_carica: e.tempo_carica
            }))
            resolve(colonnina);
        })
    })
}

exports.getReservations = function(username){
    return new Promise((resolve, reject) => {
        const sql = 'SELECT prenotazioni.*, colonnine.id_colonnina, colonnine.nome_luogo FROM prenotazioni JOIN colonnine ON prenotazioni.colonnina = colonnine.id_colonnina WHERE username = $1 ORDER BY inizio ASC';
        client.query(sql, [username], (err, row) => {
            if(err){
                reject(err);
                return;
            }
            const reservations = row.rows.map((e) => ({id_prn: e.id_prenotazione, username: e.username, nome: e.nome_luogo, inizio: e.inizio, cerchia: e.cerchia, id_col: e.id_colonnina, otp: e.otp}))
            resolve(reservations);
        })
    })
}

exports.putReservation = function(id_col, utente, nome_col, inizio, cerchia, otp, iniziotimestamp){
    return new Promise((resolve, reject) => {
        const sql = 'INSERT INTO prenotazioni (username, inizio, cerchia, colonnina, otp, iniziotimestamp) VALUES ($1, $2, $3, $4, $5, $6)';
        client.query(sql, [utente, inizio, cerchia, id_col, otp, iniziotimestamp], (err, row) => {
            if(err){
                reject(err);
                return;
            }
            const message = 'Inserimento avvenuto con successo';
            resolve(message);
        })
    })
}

exports.setBusy = function(id_col){
    const stato = 'occupata';
    return new Promise((resolve, reject) => {
        const sql = 'UPDATE colonnine SET stato = $1 WHERE id_colonnina = $2';
        client.query(sql, [stato, id_col], (err, row) => {
            if(err){
                reject(err);
                return;
            }
            const message = 'Colonnina impostata su occupata';
            resolve(message);
        })
    })
}

exports.setWaiting = function(id_col){
    const stato = 'prenotata';
    return new Promise((resolve, reject) => {
        const sql = 'UPDATE colonnine SET stato = $1 WHERE id_colonnina = $2';
        client.query(sql, [stato, id_col], (err, row) => {
            if(err){
                reject(err);
                return;
            }
            const message = 'Colonnina impostata su in attesa';
            resolve(message);
        })
    })
}

exports.setFree = function(id_col){
    const stato = 'libera';
    return new Promise((resolve, reject) => {
        const sql = 'UPDATE colonnine SET stato = $1 WHERE id_colonnina = $2';
        client.query(sql, [stato, id_col], (err, row) => {
            if(err){
                reject(err);
                return;
            }
            const message = 'Colonnina impostata su libera';
            resolve(message);
        })
    })
}

exports.setFreeScadute = function(id_col){
    const stato = 'libera';
    return new Promise((resolve, reject) => {
        const sql = 'UPDATE colonnine SET stato = $1 WHERE id_colonnina = $2';
        client.query(sql, [stato, id_col], (err, row) => {
            if(err){
                reject(err);
                return;
            }
            const message = 'Colonnina impostata su libera';
            resolve(message);
        })
    })
}

exports.delPrenotazione = function(id_prenotazione, username, nome_colonnina, inizio, cerchia, id_col){
    return new Promise((resolve, reject) => {
        const sql = 'DELETE FROM prenotazioni WHERE id_prenotazione = $1 AND username = $2 AND inizio = $3 AND cerchia = $4 AND colonnina = $5';
        client.query(sql, [id_prenotazione, username, inizio, cerchia, id_col], (err, row) => {
            if(err){
                const message = 'Errore durante l\'eliminazione'
                resolve(message);
                // return;
            }
            const message = 'Eliminazione avvenuta con successo';
            resolve(message);
        })
    })
}

// ELIMINAZIONE DI UNA PRENOTAZIONE CON ID COLONNINA
exports.delPrenotazioneFromId = function(id_col){
    return new Promise((resolve, reject) => {
        const sql = 'DELETE FROM prenotazioni WHERE colonnina = $1';
        client.query(sql, [id_col], (err, row) => {
            if(err){
                const message = 'Errore durante l\'eliminazione'
                resolve(message);
            }
            const message = 'Eliminazione avvenuta con successo';
            resolve(message);
        })
    })
}


// SELEZIONARE LE PRENOTAZIONI SCADUTE
exports.getPrnScadute = function(){
    const intervallo = '15 minutes';
    let colonnine_scadute = '';
    return new Promise((resolve, reject) => {
        const sql = 'SELECT * FROM prenotazioni WHERE iniziotimestamp < NOW() - $1::INTERVAL';
        client.query(sql, [intervallo],(err, row) => {
            if(err){
                resolve(colonnine_scadute)
            }
            colonnine_scadute = row.rows.map((e) => ({
                // id_prn: e.id_prenotazione,
                // username: e.username,
                // inizio: e.inizio,
                // cerchia: e.cerchia,
                id_col: e.colonnina,
                // otp: e.otp,
                // timestamp: e.iniziotimestamp
            }))
            resolve(colonnine_scadute);
        })
    })
}


// ELIMINARE LE PRENOTAZIONI SCADUTE
exports.delPrnScadute = function(){
    const intervallo = '15 minutes';
    return new Promise((resolve, reject) => {
        const sql = 'DELETE FROM prenotazioni WHERE iniziotimestamp < NOW() - $1::INTERVAL';
        client.query(sql, [intervallo], (err, row) => {
            if(err){
                const message = 'Impossibile eliminare';
                resolve(message);
            }
            const message = 'Eliminate con successo'
            resolve(message);
        })
    })
}

exports.getInfoReservation = function(id_prn, nome_prn, inizio, cerchia, username, id_col){
    return new Promise((resolve, reject) => {
        const sql = 'SELECT prenotazioni.*, colonnine.* FROM prenotazioni JOIN colonnine ON prenotazioni.colonnina = colonnine.id_colonnina WHERE prenotazioni.colonnina = $1 AND prenotazioni.id_prenotazione = $2 AND prenotazioni.username = $3';
        client.query(sql, [id_col, id_prn, username], (err, row) => {
            if(err){
                reject(err);
                return;
            }
            const prenotazione = row.rows.map((e) => ({
                id_prn: e.id_prenotazione,
                inizio: e.inizio,
                cerchia: e.cerchia,
                colonnina: e.colonnina,
                otp: e.otp,
                nome: e.nome_luogo,
                citta: e.ambito_nome,
                localita: e.localita
            }))
            resolve(prenotazione);
        })
    })
}

exports.getStati = function(){
    return new Promise((resolve, reject) => {
        const sql = "SELECT stato, id_colonnina FROM colonnine WHERE stato != ''";
        client.query(sql, (err, row) => {
            if(err){
                resolve(err);
            }
            
            const stati = row.rows.map((e) => ({
                id_col: e.id_colonnina,
                stato: e.stato
            }))

            resolve(stati);
        })
    })
}

exports.getStato = function(id_colonnina){
    return new Promise((resolve, reject) => {
        const sql = "SELECT stato FROM colonnine WHERE stato != '' AND id_colonnina = $1";
        client.query(sql, [id_colonnina], (err, row) => {
            if(err){
                resolve(err);
            }
            const stato = row.rows[0].stato;

            resolve(stato);
        })
    })
}