const sqlite3 = require('sqlite3').verbose()
const db = new sqlite3.Database('./fcc-backend-db.db')


function add_shorturl_to_db(actual_url) {
    return new Promise((resolve, reject) => {
        db.run('INSERT INTO SHORTURL_T (originalurl) VALUES (?)', [actual_url], (err, row) => {
            if(err)
                reject(err);
            else
                resolve(row);

        });
    })
}

function get_shorturl_by_id(short_url) {
    return new Promise((resolve, reject) => {
        db('SELECT * FROM SHORTURL_T', (err, row) => {
            if(err)
                reject(err);
            else
                resolve(row);
        });
    });
}


module.exports = {
    add_shorturl_to_db,
    get_shorturl_by_id
}