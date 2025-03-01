// index.js
// where your node app starts

// init project
var express = require('express');
var multer = require('multer')
var path = require('path')
var app = express();
const bodyParser = require('body-parser');
const upload = multer({ storage: multer.memoryStorage() })

// database init
const sqlite3 = require('sqlite3').verbose()
const db = new sqlite3.Database('./fcc-backend-db.db')

// Import Services
var db_service = require('./db-service')
app.use(express.static(path.join(__dirname, 'public')));



app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json())
app.set('trust proxy', true);
// enable CORS (https://en.wikipedia.org/wiki/Cross-origin_resource_sharing)
// so that your API is remotely testable by FCC 
var cors = require('cors');
const { memoryStorage } = require('multer');
app.use(cors({ optionsSuccessStatus: 200 }));  // some legacy browsers choke on 204

// http://expressjs.com/en/starter/static-files.html
app.use(express.static('public'));

// http://expressjs.com/en/starter/basic-routing.html
app.get("/", function (req, res) {
  const d_ts = new Date(new Date())
  res_unix = d_ts.getTime()

  res_utc = d_ts.toUTCString()
  return res.json({ unix: res_unix, utc: res_utc })
});



// your first API endpoint... 
app.get("/api/hello", function (req, res) {
  res.json({ greeting: 'hello API' });
});



app.all('/api/users', async function (req, res) {
  if (req.method === 'POST') {
    if (!req.params.id) { // If Id is undefined therefore its a new registration
      const username = req.body.username
      db.run('INSERT INTO USER_T (username) VALUES (?)', [username], function (err) {
        if (err) {
          res.status(400).json({ "error": err.message });
          return;
        }
        res.send({
          username: username,
          _id: this.lastID
        })
      })
    }
  } else {
    db.all('SELECT * FROM USER_T', (err, row) => {
      if (err) {
        res.status(400).json({ "error": err.message });
        return;
      }
      res.json(row)
    })
  }
})

app.all('/api/users/:id/logs', async function (req, res) {
})

app.post('/api/fileanalyse', upload.single('upfile'), (req, res) => {

  res.json({
    name: req.file.originalname,
    type: req.file.mimetype,
    size: req.file.size
  })
})


// URL Shorterner
app.all('/api/shorturl(/:shorturl)?', async function (req, res) {

  short_url = req.params.shorturl
  body_url = req.body.url

  function isValidHttpUrl(string) {
    let url;

    try {
      url = new URL(string);
    } catch (_) {
      return false;
    }

    return url.protocol === "http:" || url.protocol == 'https:';
  }


  if (short_url) {

    db.get('SELECT * FROM SHORTURL_T WHERE id=(?)', [short_url], (err, row) => {
      if (err) {
        res.status(400).json({ "error": err.message });
        return;
      }
      res.redirect(row.originalurl)
    })

  } else {

    if (isValidHttpUrl(body_url)) {
      db.run('INSERT INTO SHORTURL_T (originalurl) VALUES (?)', [body_url], function (err) {
        if (err) {

          res.status(400).json({ "error": err.message });
          return;
        } else {
          console.log('Inserted ID:', this.lastID);
          res.send({
            original_url: body_url,
            short_url: this.lastID
          })
        }

      })
    } else {
      res.json({
        error: 'Invalid URL'
      })
    }
  }

})


// Header Parser Microservice
app.get('/api/whoami', function (req, res) {

  ip_address = req.headers['x-forwarded-for'] || req.socket.remoteAddress
  language = req.headers['accept-language']
  software = req.headers['user-agent']

  res.json({
    "ipaddress": ip_address,
    "language": language,
    "software": software
  })
})


// 1324598400
// 2012-12-24

// Timestamp Microservice API Endpoint
app.get("/api/:date?", function (req, res) {

  if (!req.params.date) {
    const d_ts = new Date(new Date())
    res_unix = d_ts.getTime()

    res_utc = d_ts.toUTCString()
    return res.json({ unix: res_unix, utc: res_utc })

  }

  try {
    let date
    let dateParam = req.params.date


    if (!isNaN(dateParam)) {
      date = new Date(parseInt(dateParam))
    } else {
      date = new Date(dateParam)
    }

    if (isNaN(date.getTime())) {
      return res.json({ error: 'Invalid Date' })
    }

    res_unix = date.getTime()
    res_utc = date.toUTCString()


    return res.json({ unix: res_unix, utc: res_utc })
  } catch (error) {
    return res.json({ error: 'Invalid Date' })
  }
})


// Initialize Db and Table if it does not exist
db.serialize(() => {
  db.run(`
      CREATE TABLE IF NOT EXISTS SHORTURL_T (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          originalurl TEXT
      );`, (err) => {
    if (err) console.error('❌ Error creating SHORTURL_T:', err.message);
    else console.log('✅ SHORTURL_T created');
  });

  db.run(`
      CREATE TABLE IF NOT EXISTS USER_T (
          _id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE
      );`, (err) => {
    if (err) console.error('❌ Error creating USER_T:', err.message);
    else console.log('✅ USER_T created');
  });

  db.run(`
      CREATE TABLE IF NOT EXISTS EXERCISE_T (
          exec_id INTEGER PRIMARY KEY AUTOINCREMENT,
          description TEXT,
          duration TEXT,
          date DATE,
          username TEXT,
          user_id INTEGER,
          FOREIGN KEY (user_id) REFERENCES USER_T(_id)
      );`, (err) => {
    if (err) console.error('❌ Error creating EXERCISE_T:', err.message);
    else console.log('✅ EXERCISE_T created');
  });
});





// Listen on port set in environment variable or default to 3000
var listener = app.listen(process.env.PORT || 3000, function () {
  console.log('Your app is listening on port ' + listener.address().port);
  console.log("Using database file:", db.filename);

});


