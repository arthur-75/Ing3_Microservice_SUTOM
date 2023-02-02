const express = require('express');
const seedrandom = require('seedrandom')
const { readFileSync, promises: fsPromises } = require('fs');
var fs = require('fs')
var jwt = require('jsonwebtoken');
const app = express();
const PORT = 4000;
const date = new Date;
const cookieParser = require("cookie-parser");
const oneDay = 1000 * 60 * 60 * 24;
const loki_uri = process.env.LOKI || "http://127.0.0.1:3100";

const { createLogger, transports } = require("winston");
const LokiTransport = require("winston-loki");
const session = require('express-session');
const options = {
  transports: [
    new LokiTransport({
      host: loki_uri
    })
  ]
};
const logger = createLogger(options);

app.use(express.static('www'));
app.use(express.json());
app.use('/', express.static('static'));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Set up the session
app.use(session({
  secret: "thisismysecrctekeyfhrgfgrfrty84fwir767",
  saveUninitialized: true,
  cookie: { maxAge: oneDay },
  resave: false
}));

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  next()
})

// Redirections :
app.use('/user', (req, res) => { res.redirect('http://localhost:4001/login.html') });
app.use('/newuser', (req, res) => { res.redirect('http://localhost:4001/signIn.html') })

app.use('/score', (req, res) => {
  res.redirect('http://localhost:5000/score?code=' + session.code + '&attempts=' + req.body.attempts)
})

app.use('/print_score', (req, res) => {
  res.redirect('http://localhost:5000/print_score?code=' + session.code)
})

// ____________________________________________________________________
// OPEN ID 
// http://localhost:4001/callback?code=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiYSIsImlhdCI6MTY2NTY1OTkxM30.cANodYuWppu5jbvPbHoFdK36iBftQ1fTXEYh5v83BOQ
app.get("/callback", (req, res) => {
  token = req.query.code
  var decoded = jwt.verify(token, 'shhhhh');
  // je mets le username dans la session
  session.username = decoded.user
  session.code = token
  //res.send(decoded.user)
  return res.redirect('http://localhost:4000/index.html');
})

// TO DO : verifier session et rediriger vers login si pas correct 
// ____________________________________________________________________


// Jeu du motus 
function random_item(items) {
  var seed = seedrandom(date.toDateString())()
  return items[Math.floor(seed * items.length)]
}

function syncReadFile(filename) {
  const contents = readFileSync(filename, 'utf-8');
  const arr = contents.split(/\r?\n/);
  return arr;
}

app.get('/health', (req, res) => { res.send('ok') })

app.get('/mot', (req, res) => {
  logger.info({ message: 'URL ' + req.url, labels: { 'url': req.url, 'step': 'Providing the day word' } })
  const d = new Date();
  let day = d.getDay();
  let word = random_item(syncReadFile('./www/data/liste_francais_utf8.txt'))
  res.send(word)
})

app.listen(PORT, () => console.log(`Server Running at port ${PORT}`));

// Retourne le nom de l'utilisateur connecté :
app.use('/get_user', (req, res) => {
  if (typeof session === 'undefined' || typeof session.username === 'undefined') {
    res.send()
  }
  else {
    res.send({ username: session.username })
  }
  return
})

// Déconnexion de l'utilisateur
app.use('/logout', (req, res) => {
  session.username = null
  return res.redirect('http://localhost:4001/login.html');
});

