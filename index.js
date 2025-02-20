// index.js
// where your node app starts

// init project
var express = require('express');
var app = express();

app.set('trust proxy', true); 
// enable CORS (https://en.wikipedia.org/wiki/Cross-origin_resource_sharing)
// so that your API is remotely testable by FCC 
var cors = require('cors');
app.use(cors({optionsSuccessStatus: 200}));  // some legacy browsers choke on 204

// http://expressjs.com/en/starter/static-files.html
app.use(express.static('public'));

// http://expressjs.com/en/starter/basic-routing.html
app.get("/", function (req, res) {
  const d_ts = new Date(new Date())
    res_unix  = d_ts.getTime()
    
    res_utc = d_ts.toUTCString()
    return res.json({unix: res_unix, utc: res_utc})
});



// your first API endpoint... 
app.get("/api/hello", function (req, res) {
  res.json({greeting: 'hello API'});
});

app.get('/api/whoami', function(req, res) {

  ip_address = req.headers['x-forwarded-for'] || req.socket.remoteAddress
  language = req.headers['accept-language']
  software = req.headers['user-agent']

  // res.json({
  //   test: 'lol'
  // })

  console.log('ResultChanges', {
    "ipaddress": ip_address,
    "language": language,
    "software": software
  })

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
      res_unix  = d_ts.getTime()
      
      res_utc = d_ts.toUTCString()
      return res.json({unix: res_unix, utc: res_utc})

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
      return res.json({error: 'Invalid Date'})
    }

    res_unix = date.getTime()
    res_utc = date.toUTCString()


    return res.json({unix: res_unix, utc: res_utc})
  } catch (error) {
    return res.json({ error: 'Invalid Date'})
  }
}) 







// Listen on port set in environment variable or default to 3000
var listener = app.listen(process.env.PORT || 3000, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});
