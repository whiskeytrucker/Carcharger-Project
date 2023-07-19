'use strict'

const client = require('../db.js');

exports.getTest = function(){
    // client.connect();
    return new Promise((resolve, reject) => {
        const sql = 'SELECT * FROM test';
        client.query(sql, (err, row) => {
            if(err){
                console.log('Errore')
                console.log(err)
                reject(err);
                return;
            }
            console.log('Row')
            console.log(row)
            const test = row.rows[0];
            resolve(test);
        })
        // client.end();
    })
}