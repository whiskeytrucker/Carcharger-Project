'use strict'

require('dotenv').config();

const {Pool} = require('pg');

// const pool = new Pool({
//     host: 'database-3.cm1nefxysi9s.eu-north-1.rds.amazonaws.com',
//     user: 'postgres',
//     port: 5432,
//     password: 'admin123',
//     database: 'database-3'
// })

const pool = new Pool({
    user: process.env.POSTGRESQL_DB_USER,
    password: process.env.POSTGRESQL_DB_PASSWORD,
    host: process.env.RDS_HOSTNAME,
    port: process.env.RDS_PORT,
    database: process.env.RDS_DB_NAME
})

module.exports = pool;