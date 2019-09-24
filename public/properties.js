'use strict';
const UTILS = require('../utils/utils');
const fs = require('fs');
const _queryLog = UTILS.getDateTimeLog() + '=>[Query] ';
const _saveLog = UTILS.getDateTimeLog() + '=>[Save] ';
const _updateLog = UTILS.getDateTimeLog() + '=>[Update] ';
const _deleteLog = UTILS.getDateTimeLog() + '=>[Delete] ';
const _infoLog = UTILS.getDateTimeLog() + '=>[Info] ';
const _errLog = UTILS.getDateTimeLog() + '=>[Error] ';
const _logs = './logs/APIlogs.log';

//Init object
var _message = 'Default message';
//Object properties
var PROP = {
    queryLog: () => {
        return _queryLog;
    },
    insertLog: () => {
        return _saveLog;
    },
    updateLog: () => {
        return _updateLog;
    },
    infoLog: () => {
        return _infoLog;
    },
    errorLog: () => {
        return _errLog;
    },
    deleteLog: () => {
        return _deleteLog;
    },
    setmessageLog: (msg) => {
        _message = msg;
    },
    getmessageLog: () => {
        return _message;
    },
    //Save system logs
    saveLog: () => {
        fs.appendFile(_logs, _message + '\n', (err) => {
            if (err) {
                console.error(err);
            }
        });
    },
    //Encrypt password from client
    cipherPwd: (_pwd) => {
        let buff = new Buffer(_pwd);
        let cipherPwd = buff.toString('base64');
        return cipherPwd;
    }
};
//Export module to general porpouse
module.exports = PROP;