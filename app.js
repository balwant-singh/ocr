var express = require('express');
var bodyparser = require('body-parser');
var cors = require('cors');
var path = require('path');
var fs = require('fs');

var app = express();

app.set('view engine', 'ejs');

const api = require('./apis/api');

//adding middleware - cors
app.use(cors());

//body-parser
app.use(bodyparser.urlencoded({ extended: false }));
app.use(bodyparser.json());

//api
app.use('/api', api);

//static files
app.use(express.static(path.join(__dirname, 'public')))

app.use('/lib', express.static(__dirname + '/node_modules/'));

app.get('/', function(req, res) {
    res.render('ocr');
});

app.listen(3000);