// index.js
// where your node app starts

// init project
var express = require('express');
var multer = require('multer')
var { promisify } = require('util')
var { format } = require('date-fns')
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
const e = require('express');
app.use(cors({ optionsSuccessStatus: 200 }));  // some legacy browsers choke on 204

// http://expressjs.com/en/starter/static-files.html
app.use(express.static('public'));


const dbGet = promisify(db.get.bind(db))
const dbGetAll = promisify(db.all.bind(db))

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
      db.run('INSERT OR REPLACE INTO USER_T (username) VALUES (?)', [username], function (err) {
        if (err) {
          res.status(400).json({ "error": err.message });
          return;
        }
        res.json({
          username: username,
          _id: `${this.lastID}`
        })
      })
    }
  } else {
    try {
      const users = await dbGetAll('SELECT _id, username FROM USER_T')
      if (!users.length) {
        return res.json([]); // Return an empty array if no users found
      }

      res.json(users);
    } catch (error) {
      console.error("Database error:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
})

function formatDate(date) {
  let ts = date;
  if (!ts) ts = new Date();
  const d = typeof ts === "string" ? new Date(ts) : ts;

  if (isNaN(d.getTime())) return "";

  return format(d, "EEE MMM dd yyyy");
}

app.post('/api/users/:_id/exercises', async function (req, res) {
  if (!req.body.id) {
    const user_id = req.params._id
    const description = req.body.description
    const duration = req.body.duration
    let date = req.body.date
    let username = 'adam'

    if (!date) {
      date = new Date()
    }
    user = await dbGet('SELECT * FROM USER_T where _id=(?)', [user_id], function (err, row) {
      if (err) {
        res.status(400).json({ "error": err.message });
        return;
      } else {
        return row
      }
    })

    db.run('INSERT INTO EXERCISE_T (user_id,date,duration,description) VALUES (?, ?, ?, ?)', [user_id, date, duration, description], function (err) {
      if (err) {
        res.status(400).json({ "error": err.message });
        return;
      }
      const responseTest = {
        '_id': user_id,
        'username': user.username,
        'date': formatDate(new Date(date)),
        'duration': parseInt(duration),
        'description': description
      }

      res.json(responseTest)
    })

  }
})

app.all('/api/users/:_id/logs', async function (req, res) {

  const user_id = req.params._id

  let { from, to, limit } = req.query;

  let query = 'SELECT * FROM EXERCISE_T WHERE user_id = ?';
  let queryParams = [user_id];

  if (from && to) {
    query += ' AND date BETWEEN ? AND ?';
    queryParams.push(from, to);
  } else if (from) {
    query += ' AND date >= ?';
    queryParams.push(from);
  } else if (to) {
    query += ' AND date <= ?';
    queryParams.push(to);
  }

  query += ' ORDER BY date ASC'; // Order results by date

  if (limit) {
    query += ' LIMIT ?';
    queryParams.push(parseInt(limit));
  }


  exercises = await dbGetAll(query, queryParams)

  user = await dbGetAll('SELECT * FROM USER_T where _id=(?)', [user_id])

  res.json({
    username: user.username,
    count: exercises.length,
    _id: user_id,
    log: exercises.map((exc) => {
      return {
        description: exc.description,
        duration: parseInt(exc.duration),
        date: formatDate(new Date(exc.date))
      }
    })
  })
})

// File metadata microservice
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
          user_id INTEGER,
          FOREIGN KEY (user_id) REFERENCES USER_T(_id)
      );`, (err) => {
    if (err) console.error('❌ Error creating EXERCISE_T:', err.message);
    else console.log('✅ EXERCISE_T created');
  });
});



// Listen on port set in environment variable or default to 3000
var listener = app.listen(process.env.PORT || 4529, function () {
  console.log('Your app is listening on port ' + listener.address().port);
  console.log("Using database file:", db.filename);

});


