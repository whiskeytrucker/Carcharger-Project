'use strict'

const db = require('../db.js');

exports.IDColonnine = function() {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT DISTINCT id_col FROM dati_colonnine ORDER BY id_col ASC'
        db.query(sql, (err, row) => {
            if(err){
                console.trace(err)
                reject(err)
                return
            }else{
                let colonnine = row.rows.map((el) => ({
                    id: el.id_col,
                }))

                resolve(colonnine)

            }
        })
    })
}



exports.invioDatiAgg = function(id_colonnina, tempoCarica, timestamp){
    return new Promise((resolve, reject) => {
        const sql = 'UPDATE dati_colonnine SET tempo_carica = $1, timestamp = $2 WHERE id_col = $3'
        db.query(sql, [tempoCarica, timestamp, id_colonnina], (err,rows)=> {
            if(err){
                console.trace(err)
                reject(err)
                return;
            }else{
                resolve(rows)
            }
        })

    })
}


exports.invioStatoAgg = function(id_colonnina, stato){
    return new Promise((resolve, reject) => {
        const sql = 'UPDATE colonnine SET stato = $1 WHERE id_colonnina = $2'
        db.query(sql, [stato, id_colonnina], (err,rows)=> {
            if(err){
                console.trace(err)
                reject(err)
                return;
            }else{
                resolve(rows)
            }
        })

    })
}


exports.invioDatiNewCol = function(id_colonnina, tempoCarica, timestamp){
    return new Promise((resolve, reject) => {
        const sql = 'INSERT INTO dati_colonnine(tempo_carica, timestamp, id_col) VALUES($1,$2,$3)'
        db.query(sql, [tempoCarica,timestamp,id_colonnina], (err,rows)=> {
            if(err){
                console.trace(err)
                reject(err)
                return;
            }else{
                console.log("Inserimento dati nuova colonnina al DB corretto")
                resolve(rows)
            }
        })

    })
}


exports.prendiOTP = function(){
    return new Promise((resolve, reject) => {
        const sql = 'SELECT colonnina, otp FROM prenotazioni'
        db.query(sql, [], (err,row)=> {
            if(err){
                console.trace(err)
                reject(err)
                return;
            }else{
                const prenotazioni = row.rows.map((el) => ({
                    id: el.colonnina,
                    otp: el.otp
                }))

                resolve(prenotazioni)
            }
        })

    })
} 