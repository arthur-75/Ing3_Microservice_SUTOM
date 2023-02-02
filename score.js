const express = require('express')
const seedrandom = require('seedrandom')
const { readFileSync, promises: fsPromises } = require('fs')
var fs = require('fs')
var jwt = require('jsonwebtoken');
const app = express()
const port = 5000
const date = new Date;
var path = require('path');


var bodyParser = require('body-parser');

app.use(express.static('www'));
app.use(express.urlencoded({ extended: false }));
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*')
    next()
})

app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');
app.set('views', path.join(__dirname, '/www'));

// Mise à jour des scores et insertion de l'utilisateur s'il n'existe pas dans le score.json 
app.use('/score', (req, res) => {
    var json = JSON.parse(readFileSync('./bdd/score.json').toString());
    decoded = jwt.verify(req.query.code, 'shhhhh');
    if (json.hasOwnProperty(decoded.user) == true) {
        json[decoded.user].score = json[decoded.user].score + 1
        json[decoded.user].winning_time_average = (json[decoded.user].winning_time_average * (json[decoded.user].score - 1) + parseInt(req.query.attempts)) / json[decoded.user].score
        fs.writeFile("./bdd/score.json", JSON.stringify(json), function (err) {
            if (err) {
                console.log(err);
            }
        });

        res.send("ok")
    }
    else {
        // INSERT user in the JSON FILE
        json[decoded.user] = { score: 1, winning_time_average: parseInt(req.query.attempts) };
        fs.writeFile("./bdd/score.json", JSON.stringify(json, null, '\t'), function (err) {
            if (err) {
                console.log(err);
            }
        });
    }
})

// Affichage des scores (moyenne et nombre de mots trouvés)
app.use('/print_score', (req, res) => {
    var json = JSON.parse(readFileSync('./bdd/score.json').toString());
    decoded = jwt.verify(req.query.code, 'shhhhh');
    if (json.hasOwnProperty(decoded.user) != true) {
        // INSERT user in the JSON FILE 
        json[decoded.user] = { score: 0, winning_time_average: 0 };
        fs.writeFile("./bdd/score.json", JSON.stringify(json, null, '\t'), function (err) {
            if (err) {
                console.log(err);
            }
        });
    }
    if (!json[decoded.user]) {
        res.send({ score: 0, average: 0 })
    }
    score = json[decoded.user].score
    average = json[decoded.user].winning_time_average
    res.render('score.html', { average: score, average: average });
})

app.listen(port, () => {
    console.log(`Score app listening on port http://localhost:${port}`)
})