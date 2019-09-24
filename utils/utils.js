'use strict';
var _result;
//Object
var UTILS = {};
//Methods
UTILS.getDateTimeLog = function() {
    var _d = new Date();
    var _month = _d.getMonth();
    switch (_month) {
        case 0:
            _month = "01"
            break;
        case 1:
            _month = "02"
            break;
        case 2:
            _month = "03"
            break;
        case 3:
            _month = "04"
            break;
        case 4:
            _month = "05"
            break;
        case 5:
            _month = "06"
            break;
        case 6:
            _month = "07"
            break;
        case 7:
            _month = "08"
            break;
        case 8:
            _month = "09"
            break;
        case 9:
            _month = "10"
            break;
        case 10:
            _month = "11"
            break;
        case 11:
            _month = "12"
            break;
        default:
            _month = "00"
    }
    _result = _d.getDate() + _month + _d.getFullYear() + " " + _d.getHours() + ":" + _d.getMinutes() + ":" + _d.getSeconds() + ":" + _d.getMilliseconds() + " ";
    return _result;
};
//Export module to general porpouse
module.exports = UTILS;