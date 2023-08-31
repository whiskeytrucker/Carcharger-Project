'use strict'

const client = require('../db.js');

exports.getTest = function(){
    return new Promise((resolve, reject) => {
        const sql = 'SELECT * FROM test';
        client.query(sql, (err, row) => {
            if(err){
                reject(err);
                return;
            }
            const test = row.rows[0];
            resolve(test);
        })
    })
}