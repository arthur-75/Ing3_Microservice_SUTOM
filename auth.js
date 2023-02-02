const express = require('express')
const app = express();
const PORT = 4001;
const { readFileSync, promises: fsPromises } = require('fs');
var fs = require('fs')
var jwt = require('jsonwebtoken');

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  next()
})

app.use(express.static('www'));
app.use('/', express.static('static'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));


app.set('trust proxy', 1)


// Fonction de hachage cryptographique
const { createHash } = require('crypto');
const { isNull } = require('util');
function hash(string) { return createHash('sha256').update(string).digest('hex'); }

// Vérification des données de connexion 
app.use('/user', (req, res) => {
  var json = JSON.parse(readFileSync('./bdd/user.json').toString());

  if (json.hasOwnProperty(req.body.username) == true) {
    if (json[req.body.username]["password"] == hash(req.body.password)) {
      var token = jwt.sign({ user: req.body.username }, 'shhhhh');
      res.send({ token: token })
    }
    else {
      res.send({ status: 'fail', err: 'Invalid password, please try again' });
    }
  }
  else {
    res.send({ status: 'fail', err: 'Unknown username, please try again' });
  }
})

// Inscription d'un nouvel utilisateur 
app.use('/newuser', (req, res) => {
  var json = JSON.parse(readFileSync('./bdd/user.json').toString());

  if (json.hasOwnProperty(req.body.username) == true) {
    res.send({ status: 'fail', err: 'This username already exists, please try again' });
  }
  else {
    // INSERT new user in the JSON FILE
    json[req.body.username] = { password: hash(req.body.password) };
    fs.writeFile("./bdd/user.json", JSON.stringify(json, null, '\t'), function (err) {
      if (err) {
        console.log(err);
      }
    });
    var token = jwt.sign({ user: req.body.username }, 'shhhhh');
    res.send({ token: token })
  }
})

app.listen(PORT, () => console.log(`Server Running at port ${PORT}`));