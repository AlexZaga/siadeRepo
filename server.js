'use strict';
// Server headers
const express = require('express');
const session = require('express-session');
const helmet = require('helmet');
const bodyParser = require('body-parser');
const compress = require('compression');
const http = require('http');
const path = require('path');

//Define Object
var PROP = require('./public/properties');
//Create server
const app = express();
//Methods allowed
var allowMethods = (req, res, next) => {
        res.header('Access-Control-Allow-Methods', "GET, POST, PUT, DELETE");
        next();
    }
    //Token Validator
var allowCrossTokenHeader = (req, res, next) => {
        res.header('Access-Control-Allow-Headers', 'token');
        next();
    }
    //Sanitize port
app.set('port', process.env.PORT || 4000);
//Best practice secure
app.set('trusty proxy', 1);
//Compress all request
app.use(compress());
//Middleware to protect for some vulnerabilities by HTTP
app.use(helmet());
//Middleware to parse body
app.use(bodyParser.urlencoded({ extended: false }));
//Understand JSON format
app.use(bodyParser.json());
//Use secure options
app.use(allowMethods);
app.use(allowCrossTokenHeader);
//Set route object
app.use(express.Router());
//Set session object
app.use(session({
    secret: 's3cr3t',
    resave: false,
    saveUninitialized: true,
    name: 'sessionId'
}));
app.use(function timelog(req, res, next) {
    PROP.setmessageLog(PROP.infoLog() + 'Foreing IP: ' + req.ip);
    PROP.saveLog();
    console.log(PROP.getmessageLog());
    next();
});
//Start server
require('./routes')(app);
http.createServer(app).listen(app.get('port'), () => {
    PROP.setmessageLog(PROP.infoLog() + 'Server API listening and ready on ' + app.get('port') + ' port.');
    PROP.saveLog();
    console.log(PROP.getmessageLog());
});