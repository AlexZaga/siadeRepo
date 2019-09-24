'use strict';
require('dotenv/config');
const _200suc = '200 Success';
const _201cre = '201 Created';
const _202suc = '202 Accepted'
const _204err = '204 No Content';
const _400err = '400 Bad Request';
const _401err = '401 Unauthorized';
const _404err = '404 Not Found';
const _406err = '406 Not Acceptable';
const _409err = '409 Conflict';
const _422err = '422 Unprocessable Entity';
const _500err = '500 Internal Server Error';
const _501err = '501 Not Implemented';

var crypto = require('crypto');
var uid = require('uid-safe');
var cors = require('cors');
var CNX = require('../public/connection');
var PROP = require('../public/properties');
var sess;

//Hash secret
var secrethash = (_secret) => {
    if (_secret === null || _secret === "") {
        return "";
    } else {
        let _hash = crypto.createHmac("sha256", process.env.SEED).update(_secret).digest("hex");
        return _hash;
    }
};
//Implements authentication
var auth = (req, res, next) => {
    let _usersess = req.session.active;
    if (!_usersess) {
        //Rise error
        let _answ = JSON.stringify({ message: _401err });
        return next(_answ);
    } else {
        return next();
    }
};
//Sanitize parameters
var authparams = (param) => {
    var valor = parseInt(param);
    if (!isNaN(valor) && valor > 0) {
        return true;
    } else {
        return false;
    }
};
var flagparams = (param) => {
    var valor = parseInt(param);
    if (!isNaN(valor) && valor >= 0) {
        return true;
    } else {
        return false;
    }
};
var emailparam = (param) => {
    var reg = /^\w+([-+.']\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/
    if (reg.test(param)) {
        return true;
    } else {
        return false;
    }
};
var validuserparam = (param) => {
    //var regex = /^([0-9],[a-zA-Z ],[0-9]+)$/;
    var regex = /^([a-zA-Z]{1,1})$/;
    if (regex.test(param)) {
        return true;
    } else {
        return false;
    }
};
var saveLog = (_log) => {
    PROP.setmessageLog(_log);
    PROP.saveLog();
    console.log(PROP.getmessageLog());
};
var printGlobalErrorMessage = (_res) => {
    saveLog(PROP.errorLog() + _406err + ' [ parameter(s) not allowed ]');
    _res.status(406).json({ result: _406err });
};
var printSuccessMessage = (_res, _entity, _object) => {
    saveLog(PROP.queryLog() + 'Retrived record(s) from ' + _entity + ' Entity: ' + _200suc);
    _res.status(200).json(_object);
};
var printTransactionErrorMessage = (_res, _err) => {
    saveLog(PROP.errorLog() + _422err + ' ' + _err);
    console.error('Transaction: ' + _err);
    _res.status(422).json({ result: _422err });
};
var printCommitErrorMessage = (_res, _err) => {
    console.error('Commit: ' + _err);
    _res.status(500).json({ result: _err });
};
var printQueryErrorMessage = (_res, _err, _custerrmsg, _errId) => {
    saveLog(PROP.errorLog() + _custerrmsg + ' ' + _err);
    _res.status(_errId).json({ result: _custerrmsg });
};
var printInsertErrorMessage = (_res, _object) => {
    saveLog(PROP.errorLog() + 'No record added: ' + _204err);
    console.log(_object);
    _res.status(204).json(_object);
};
var printInsertSuccessMessage = (_res, _object) => {
    saveLog(PROP.insertLog() + 'New record added: ' + _201cre);
    _res.status(201).json(_object);
};
var printUpdateSuccessMessage = (_res, _object) => {
    saveLog(PROP.insertLog() + 'Record updated: ' + _202suc);
    _res.status(202).json(_object);
};
var printUpdateErrorMessage = (_res, _object) => {
    saveLog(PROP.errorLog() + 'No record updated: ' + _404err);
    _res.status(404).json(_object);
};
//Initialize DB connection
CNX.initilizeDB();
//Start API functions
module.exports = (app) => {
    //GET method by default
    app.get('/', cors(), (req, res) => {
        saveLog(PROP.infoLog() + 'API communication.');
        res.status(200).json({ result: _200suc });
    });
    //****************************** Status Entity actions *************************************
    //GET All Status rows
    app.get('/api/estatus', cors(), (req, res) => {
        CNX.getCNX().query(CNX.getallStatus(), (err, result) => {
            if (err) {
                printQueryErrorMessage(res, err, _422err, 422);
            } else if (result.length > 0) {
                printSuccessMessage(res, 'Estatus', result);
            } else {
                printQueryErrorMessage(res, "", _404err, 404);
            }
        });
    });
    //GET Status item by ID
    app.get('/api/estatus/:id', cors(), (req, res) => {
        let _id = req.params.id || "";
        if (flagparams(_id)) {
            CNX.getCNX().query(CNX.getstatusById(), [_id], (err, result) => {
                if (err) {
                    printQueryErrorMessage(res, err, _422err, 422);
                } else if (result.length > 0) {
                    printSuccessMessage(res, 'Estatus', result);
                } else {
                    printQueryErrorMessage(res, "", _404err, 404);
                }
            });
        } else {
            printGlobalErrorMessage(res);
        }
    });
    //Update Status item
    app.put('/api/updestatus/', cors(), (req, res) => {
        let _id = req.body.id || "";
        let _desc = req.body.descripcion || "";
        if (flagparams(_id)) {
            CNX.getCNX().beginTransaction(err => {
                if (err) {
                    printTransactionErrorMessage(res, err);
                } else {
                    CNX.getCNX().query(CNX.updateStatus(), [_desc, _id], (err, result, fields) => {
                        if (err) {
                            saveLog(PROP.errorLog() + _422err + ' ' + err);
                            CNX.getCNX().rollback(err => {
                                if (err) {
                                    console.error('Rollback:' + err);
                                }
                                res.status(406).json({ result: _406err });
                            });
                        } else if (result.affectedRows > 0) {
                            CNX.getCNX().commit(err => {
                                if (err) {
                                    printCommitErrorMessage(res, err);
                                } else {
                                    printUpdateSuccessMessage(res, result);
                                }
                            });
                        } else {
                            printUpdateErrorMessage(res, result);
                        }
                    });
                }
            });
        } else {
            printGlobalErrorMessage(res);
        }
    });
    //****************************** Estados Entity actions ************************************/
    app.get('/api/estados', cors(), (req, res) => {
        CNX.getCNX().query(CNX.getallStates(), (err, result) => {
            if (err) {
                printQueryErrorMessage(res, err);
            } else {
                printSuccessMessage(res, 'Estados', result);
            }
        });
    });
    app.get('/api/estado/:id', cors(), (req, res) => {
        let _id = req.params.id || "";
        if (flagparams(_id)) {
            CNX.getCNX().query(CNX.getstatesById(), [_id], (err, result) => {
                if (err) {
                    printQueryErrorMessage(res, err);
                } else {
                    printSuccessMessage(res, 'Estados', result);
                }
            });
        } else {
            printGlobalErrorMessage(res);
        }
    });
    app.put('/api/updestado', cors(), (req, res) => {
        let _id = req.body.id || "";
        let _desc = req.body.descripcion || "";
        if (flagparams(_id)) {
            CNX.getCNX().beginTransaction(err => {
                if (err) {
                    printTransactionErrorMessage(res, err);
                } else {
                    CNX.getCNX().query(CNX.updateStates(), [_desc, _id], (err, result, fields) => {
                        if (err) {
                            saveLog(PROP.errorLog() + _422err + err);
                            CNX.getCNX().rollback(err => {
                                if (err) {
                                    console.error('Rollback:' + err);
                                }
                                res.status(406).json({ result: _406err });
                            });
                        } else if (result.affectedRows > 0) {
                            CNX.getCNX().commit(err => {
                                if (err) {
                                    printCommitErrorMessage(res, err);
                                } else {
                                    printUpdateSuccessMessage(res, result);
                                }
                            });
                        } else {
                            printUpdateErrorMessage(res, result);
                        }
                    });
                }
            });
        } else {
            printGlobalErrorMessage(res);
        }
    });
    //****************************** Niveles Acceso Entity actions ************************************/
    app.get('/api/nivelesacceso', cors(), (req, res) => {
        CNX.getCNX().query(CNX.getallNivelesAcceso(), (err, result) => {
            if (err) {
                printQueryErrorMessage(res, err);
            } else {
                printSuccessMessage(res, 'Nivel Acceso', result);
            }
        });
    });
    app.get('/api/nivelacceso/:id', cors(), (req, res) => {
        let _id = req.params.id || "";
        if (flagparams(_id)) {
            CNX.getCNX().query(CNX.getnivelesaccessoById(), [_id], (err, result) => {
                if (err) {
                    printQueryErrorMessage(res, err);
                } else {
                    printSuccessMessage(res, 'Nivel Acceso', result);
                }
            });
        } else {
            printGlobalErrorMessage(res);
        }
    });
    app.put('/api/updnivelacceso', cors(), (req, res) => {
        let _id = req.body.id || "";
        let _desc = req.body.descripcion || "";
        let _estatus = req.body.estatus || "";
        if (flagparams(_id) && flagparams(_estatus)) {
            CNX.getCNX().beginTransaction(err => {
                if (err) {
                    printTransactionErrorMessage(res, err);
                } else {
                    CNX.getCNX().query(CNX.updateNivelAcceso(), [_desc, _estatus, _id], (err, result, fields) => {
                        if (err) {
                            saveLog(PROP.errorLog() + _406err + err);
                            CNX.getCNX().rollback(err => {
                                if (err) {
                                    console.error('Rollback:' + err);
                                }
                                res.status(406).json({ result: _406err });
                            });
                        } else if (result.affectedRows > 0) {
                            CNX.getCNX().commit(err => {
                                if (err) {
                                    printCommitErrorMessage(res, err);
                                } else {
                                    printUpdateSuccessMessage(res, result);
                                }
                            });
                        } else {
                            printUpdateErrorMessage(res, result);
                        }
                    });
                }
            });
        } else {
            printGlobalErrorMessage(res);
        }
    });
    app.post('/api/newnivelacceso', cors(), (req, res) => {
        let _id = req.body.id || "";
        let _desc = req.body.descripcion || "";
        let _estatus = req.body.estatus || "";
        if (flagparams(_id) && flagparams(_estatus)) {
            CNX.getCNX().beginTransaction(err => {
                if (err) {
                    printTransactionErrorMessage(res, err);
                } else {
                    CNX.getCNX().query(CNX.newNivelAcceso(), [_id, _desc, _estatus], (err, result, fields) => {
                        if (err) {
                            saveLog(PROP.errorLog() + _406err + err);
                            CNX.getCNX().rollback(err => {
                                if (err) {
                                    console.error('Rollback:' + err);
                                }
                                res.status(406).json({ result: _406err });
                            });
                        } else if (result.affectedRows > 0) {
                            CNX.getCNX().commit(err => {
                                if (err) {
                                    printCommitErrorMessage(res, err);
                                } else {
                                    printInsertSuccessMessage(res, result);
                                }
                            });
                        } else {
                            printInsertErrorMessage(res, result);
                        }
                    });
                }
            });
        } else {
            printGlobalErrorMessage(res);
        }
    });
    //****************************** Paises Entity actions ************************************/
    app.get('/api/paises', cors(), (req, res) => {
        CNX.getCNX().query(CNX.getallPaises(), (err, result) => {
            if (err) {
                printQueryErrorMessage(res, err);
            } else {
                printSuccessMessage(res, 'Paises', result);
            }
        });
    });
    app.get('/api/pais/:id', cors(), (req, res) => {
        let _id = req.params.id || "";
        if (flagparams(_id)) {
            CNX.getCNX().query(CNX.getpaisById(), [_id], (err, result) => {
                if (err) {
                    printQueryErrorMessage(res, err);
                } else {
                    printSuccessMessage(res, 'Paises', result);
                }
            });
        } else {
            printGlobalErrorMessage(res);
        }
    });
    app.put('/api/updpais', cors(), (req, res) => {
        let _id = req.body.id || "";
        let _desc = req.body.descripcion || "";
        let _estatus = req.body.estatus || "";
        if (flagparams(_id) && flagparams(_estatus)) {
            CNX.getCNX().beginTransaction(err => {
                if (err) {
                    printTransactionErrorMessage(res, err);
                } else {
                    CNX.getCNX().query(CNX.updatePais(), [_desc, _estatus, _id], (err, result, fields) => {
                        if (err) {
                            saveLog(PROP.errorLog() + _406err + err);
                            CNX.getCNX().rollback(err => {
                                if (err) {
                                    console.error('Rollback:' + err);
                                }
                                res.status(406).json({ result: _406err });
                            });
                        } else if (result.affectedRows > 0) {
                            CNX.getCNX().commit(err => {
                                if (err) {
                                    printCommitErrorMessage(res, err);
                                } else {
                                    printUpdateSuccessMessage(res, result);
                                }
                            });
                        } else {
                            printUpdateErrorMessage(res, result);
                        }
                    });
                }
            });
        } else {
            printGlobalErrorMessage(res);
        }
    });
    app.post('/api/newpais', cors(), (req, res) => {
        let _id = req.body.id || "";
        let _pais = escape(req.body.nombre) || "";
        let _estatus = req.body.estatus || "";
        if (flagparams(_id) && flagparams(_estatus)) {
            CNX.getCNX().beginTransaction(err => {
                if (err) {
                    printTransactionErrorMessage(res, err);
                } else {
                    CNX.getCNX().query(CNX.newPais(), [_id, _pais, _estatus], (err, result, fields) => {
                        if (err) {
                            saveLog(PROP.errorLog() + _406err + err);
                            CNX.getCNX().rollback(err => {
                                if (err) {
                                    console.error('Rollback:' + err);
                                }
                                res.status(406).json({ result: _406err });
                            });
                        } else if (result.affectedRows > 0) {
                            CNX.getCNX().commit(err => {
                                if (err) {
                                    printCommitErrorMessage(res, err);
                                } else {
                                    printInsertSuccessMessage(res, result);
                                }
                            });
                        } else {
                            printInsertErrorMessage(res, result);
                        }
                    });
                }
            });
        } else {
            printGlobalErrorMessage(res);
        }
    });
    //****************************** Bancos Entity actions ************************************/
    app.get('/api/bancos', cors(), (req, res) => {
        CNX.getCNX().query(CNX.getallBancos(), (err, result) => {
            if (err) {
                printQueryErrorMessage(res, err);
            } else {
                printSuccessMessage(res, 'Bancos', result);
            }
        });
    });
    app.get('/api/banco/:id', cors(), (req, res) => {
        let _id = req.params.id || "";
        if (flagparams(_id)) {
            CNX.getCNX().query(CNX.getbancoById(), [_id], (err, result) => {
                if (err) {
                    printQueryErrorMessage(res, err);
                } else {
                    printSuccessMessage(res, 'Bancos', result);
                }
            });
        } else {
            printGlobalErrorMessage(res);
        }
    });
    app.put('/api/updbanco', cors(), (req, res) => {
        let _id = req.body.id || "";
        let _desc = req.body.descripcion || "";
        let _ref = req.body.referencia || "";
        let _estatus = req.body.estatus || "";
        if (flagparams(_id) && flagparams(_estatus)) {
            CNX.getCNX().beginTransaction(err => {
                if (err) {
                    printTransactionErrorMessage(res, err);
                } else {
                    CNX.getCNX().query(CNX.updateBanco(), [_desc, _ref, _estatus, _id], (err, result, fields) => {
                        if (err) {
                            saveLog(PROP.errorLog() + _406err + err);
                            CNX.getCNX().rollback(err => {
                                if (err) {
                                    console.error('Rollback:' + err);
                                }
                                res.status(406).json({ result: _406err });
                            });
                        } else if (result.affectedRows > 0) {
                            CNX.getCNX().commit(err => {
                                if (err) {
                                    printCommitErrorMessage(res, err);
                                } else {
                                    printUpdateSuccessMessage(res, result);
                                }
                            });
                        } else {
                            printUpdateErrorMessage(res, result);
                        }
                    });
                }
            });
        } else {
            printGlobalErrorMessage(res);
        }
    });
    app.post('/api/newbanco', cors(), (req, res) => {
        let _id = req.body.id || "";
        let _banco = req.body.nombre || "";
        let _referencia = req.body.referencia || "";
        let _estatus = req.body.estatus || "";
        if (flagparams(_id) && flagparams(_estatus)) {
            CNX.getCNX().beginTransaction(err => {
                if (err) {
                    printTransactionErrorMessage(res, err);
                } else {
                    CNX.getCNX().query(CNX.newBanco(), [_id, _banco, _referencia, _estatus], (err, result, fields) => {
                        if (err) {
                            saveLog(PROP.errorLog() + _406err + err);
                            CNX.getCNX().rollback(err => {
                                if (err) {
                                    console.error('Rollback:' + err);
                                }
                                res.status(406).json({ result: _406err });
                            });
                        } else if (result.affectedRows > 0) {
                            CNX.getCNX().commit(err => {
                                if (err) {
                                    printCommitErrorMessage(res, err);
                                } else {
                                    printInsertSuccessMessage(res, result);
                                }
                            });
                        } else {
                            printInsertErrorMessage(res, result);
                        }
                    });
                }
            });
        } else {
            printGlobalErrorMessage(res);
        }
    });
    //****************************** Condominos Entity actions ************************************/
    app.get('/api/condominos', cors(), (req, res) => {
        CNX.getCNX().query(CNX.getallCondominos(), (err, result) => {
            if (err) {
                printQueryErrorMessage(res, err);
            } else {
                printSuccessMessage(res, 'Condominos', result);
            }
        });
    });
    app.get('/api/condomino/:id', cors(), (req, res) => {
        let _id = req.params.id || "";
        if (flagparams(_id)) {
            CNX.getCNX().query(CNX.getcondominoById(), [_id], (err, result) => {
                if (err) {
                    printQueryErrorMessage(res, err);
                } else {
                    printSuccessMessage(res, 'Condominos', result);
                }
            });
        } else {
            printGlobalErrorMessage(res);
        }
    });
    app.put('/api/updcondomino', cors(), (req, res) => {
        let _id = req.body.id || "";
        let _titulares = req.body.titulares || "";
        let _piso = req.body.piso || "";
        let _nivelacceso = req.body.nivelacceso || "";
        let _condomino = req.body.condomino || "";
        let _estatus = req.body.estatus || "";
        if (flagparams(_id) && flagparams(_estatus) && flagparams(_piso)) {
            CNX.getCNX().beginTransaction(err => {
                if (err) {
                    printTransactionErrorMessage(res, err);
                } else {
                    CNX.getCNX().query(CNX.updateCondomino(), [_titulares, _piso, _nivelacceso, _condomino, _estatus, _id], (err, result, fields) => {
                        if (err) {
                            saveLog(PROP.errorLog() + _406err + err);
                            CNX.getCNX().rollback(err => {
                                if (err) {
                                    console.error('Rollback:' + err);
                                }
                                res.status(406).json({ result: _406err });
                            });
                        } else if (result.affectedRows > 0) {
                            CNX.getCNX().commit(err => {
                                if (err) {
                                    printCommitErrorMessage(res, err);
                                } else {
                                    printUpdateSuccessMessage(res, result);
                                }
                            });
                        } else {
                            printUpdateErrorMessage(res, result);
                        }
                    });
                }
            });
        } else {
            printGlobalErrorMessage(res);
        }
    });
    app.post('/api/newcondomino', cors(), (req, res) => {
        let _id = req.body.id || "";
        let _titulares = req.body.titulares || "";
        let _piso = req.body.piso || "";
        let _nivelacceso = req.body.nivelacceso || "";
        let _condominio = req.body.condominio || "";
        let _estatus = req.body.estatus || "";
        if (flagparams(_id) && flagparams(_estatus) && flagparams(_condominio) && flagparams(_nivelacceso)) {
            CNX.getCNX().beginTransaction(err => {
                if (err) {
                    printTransactionErrorMessage(res, err);
                } else {
                    CNX.getCNX().query(CNX.newCondomino(), [_id, _titulares, _piso, _nivelacceso, _condominio, _estatus], (err, result, fields) => {
                        if (err) {
                            saveLog(PROP.errorLog() + _406err + ' ' + err);
                            CNX.getCNX().rollback(err => {
                                if (err) {
                                    console.error('Rollback:' + err);
                                }
                                res.status(406).json({ result: _406err });
                            });
                        } else if (result.affectedRows > 0) {
                            CNX.getCNX().commit(err => {
                                if (err) {
                                    printCommitErrorMessage(res, err);
                                } else {
                                    printInsertSuccessMessage(res, result);
                                }
                            });
                        } else {
                            printInsertErrorMessage(res, result);
                        }
                    });
                }
            });
        } else {
            printGlobalErrorMessage(res);
        }
    });
    //****************************** Municipios Entity actions ************************************/
    app.get('/api/municipios', cors(), (req, res) => {
        CNX.getCNX().query(CNX.getallMunicipios(), (err, result) => {
            if (err) {
                printQueryErrorMessage(res, err);
            } else {
                printSuccessMessage(res, 'Municipios', result);
            }
        });
    });
    app.get('/api/municipio/:id', cors(), (req, res) => {
        let _id = req.params.id || "";
        if (flagparams(_id)) {
            CNX.getCNX().query(CNX.getmunicipioById(), [_id], (err, result) => {
                if (err) {
                    printQueryErrorMessage(res, err);
                } else {
                    printSuccessMessage(res, 'Municipios', result);
                }
            });
        } else {
            printGlobalErrorMessage(res);
        }
    });
    app.put('/api/updmunicipio', cors(), (req, res) => {
        let _id = req.body.id || "";
        let _demarcacion = req.body.demarcacion || "";
        let _estatus = req.body.estatus || "";
        if (flagparams(_id) && flagparams(_estatus)) {
            CNX.getCNX().beginTransaction(err => {
                if (err) {
                    printTransactionErrorMessage(_res, err);
                } else {
                    CNX.getCNX().query(CNX.updateMunicipio(), [_demarcacion, _estatus, _id], (err, result, fields) => {
                        if (err) {
                            saveLog(PROP.errorLog() + _406err + err);
                            CNX.getCNX().rollback(err => {
                                if (err) {
                                    console.error('Rollback:' + err);
                                }
                                res.status(406).json({ result: _406err });
                            });
                        } else if (result.affectedRows > 0) {
                            CNX.getCNX().commit(err => {
                                if (err) {
                                    printCommitErrorMessage(res, err);
                                } else {
                                    printUpdateSuccessMessage(res, result);
                                }
                            });
                        } else {
                            printUpdateErrorMessage(res, result);
                        }
                    });
                }
            });
        } else {
            printGlobalErrorMessage(res);
        }
    });
    app.post('/api/newmunicipio', cors(), (req, res) => {
        let _id = req.body.id || "";
        let _demarcacion = req.body.demarcacion || "";
        let _estatus = req.body.estatus || "";
        let _estado = req.body.estado || "";
        if (flagparams(_id) && flagparams(_estatus) && flagparams(_estado)) {
            CNX.getCNX().beginTransaction(err => {
                if (err) {
                    printTransactionErrorMessage(_res, err);
                } else {
                    CNX.getCNX().query(CNX.newMunicipio(), [_demarcacion, _estatus, _id], (err, result, fields) => {
                        if (err) {
                            saveLog(PROP.errorLog() + _406err + err);
                            CNX.getCNX().rollback(err => {
                                if (err) {
                                    console.error('Rollback:' + err);
                                }
                                res.status(406).json({ result: _406err });
                            });
                        } else if (result.affectedRows > 0) {
                            CNX.getCNX().commit(err => {
                                if (err) {
                                    printCommitErrorMessage(res, err);
                                } else {
                                    printInsertSuccessMessage(res, result);
                                }
                            });
                        } else {
                            printInsertErrorMessage(res, result);
                        }
                    });
                }
            });
        } else {
            printGlobalErrorMessage(res);
        }
    });
    //****************************** Condominios Entity actions *************************************
    app.get('/api/condominios', cors(), (req, res) => {
        CNX.getCNX().query(CNX.getallCondominios(), (err, result) => {
            if (err) {
                printQueryErrorMessage(res, err);
            } else {
                printSuccessMessage(res, 'Condominios', result);
            }
        });
    });
    app.get('/api/condominios/:id', cors(), (req, res) => {
        let _id = req.params.id || "";
        if (flagparams(_id)) {
            CNX.getCNX().query(CNX.getcondominioById(), [_id], (err, result) => {
                if (err) {
                    printQueryErrorMessage(res, err);
                } else {
                    printSuccessMessage(res, 'Condominios', result);
                }
            });
        } else {
            printGlobalErrorMessage(res);
        }
    });
    app.put('/api/updcondominio', cors(), (req, res) => {
        let _id = req.body.id || "";
        let _condominio = req.body.condominio || "";
        let _exterior = req.body.exterior || "";
        let _ubicacion = req.body.ubicacion || "";
        let _colonia = req.body.colonia || "";
        let _cp = req.body.codigopostal || "";
        let _demarcacion = req.body.demarcacionId || "";
        let _estado = req.body.estadoId || "";
        let _estatus = req.body.estatus || "";
        if (flagparams(_id) && flagparams(_cp) && flagparams(_demarcacion) && flagparams(_estado) && flagparams(_estatus)) {
            CNX.getCNX().beginTransaction(err => {
                if (err) {
                    printTransactionErrorMessage(_res, err);
                } else {
                    CNX.getCNX().query(CNX.updateCondiminio(), [_condominio, _exterior, _ubicacion, _colonia, _cp, _demarcacion, _estado, _estatus, _id], (err, result, fields) => {
                        if (err) {
                            saveLog(PROP.errorLog() + _406err + err);
                            CNX.getCNX().rollback(err => {
                                if (err) {
                                    console.error('Rollback:' + err);
                                }
                                res.status(500).json({ result: _406err });
                            });
                        } else if (result.affectedRows > 0) {
                            CNX.getCNX().commit(err => {
                                if (err) {
                                    printCommitErrorMessage(res, err);
                                } else {
                                    printUpdateSuccessMessage(res, result);
                                }
                            });
                        } else {
                            printUpdateErrorMessage(res, result);
                        }
                    });
                }
            });
        } else {
            printGlobalErrorMessage(res);
        }
    });
    app.post('/api/newcondominio', cors(), (req, res) => {
        let _id = req.body.id || "";
        let _condominio = req.body.condominio || "";
        let _exterior = req.body.exterior || "";
        let _ubicacion = req.body.ubicacion || "";
        let _colonia = req.body.colonia || "";
        let _cp = req.body.codigopostal || "";
        let _demarcacion = req.body.demarcacionId || "";
        let _estado = req.body.estadoId || "";
        let _estatus = req.body.estatus || "";
        //Evaluate params
        if (flagparams(_id) && flagparams(_cp) && flagparams(_demarcacion) && flagparams(_estado) && flagparams(_estatus)) {
            //Begin transaction
            CNX.getCNX().beginTransaction(err => {
                if (err) {
                    printTransactionErrorMessage(_res, err);
                } else {
                    CNX.getCNX().query(CNX.newCondominio(), [_id, _condominio, _exterior, _ubicacion, _colonia, _cp, _demarcacion, _estado, _estatus], (err, result, fields) => {
                        if (err) {
                            saveLog(PROP.errorLog() + _406err + ' ' + err);
                            CNX.getCNX().rollback(err => {
                                if (err) {
                                    console.error('Rollback: ' + err);
                                }
                                res.status(406).json({ result: _406err });
                            });
                        } else if (result.affectedRows > 0) {
                            CNX.getCNX().commit(err => {
                                if (err) {
                                    printCommitErrorMessage(res, err);
                                } else {
                                    printInsertSuccessMessage(res, result);
                                }
                            });
                        } else {
                            printInsertErrorMessage(res, result);
                        }
                    });
                }
            });
        } else {
            printGlobalErrorMessage(res);
        }
    });
    //****************************** Correos Entity actions *************************************
    app.get('/api/correos', cors(), (req, res) => {
        CNX.getCNX().query(CNX.getallCorreos(), (err, result) => {
            if (err) {
                printQueryErrorMessage(res, err, _422err, 422);
            } else if (result.length > 0) {
                printSuccessMessage(res, 'Correos', result);
            } else {
                printQueryErrorMessage(res, "", _404err, 404);
            }
        });
    });
    app.get('/api/correo/:id', cors(), (req, res) => {
        let _id = req.params.id || "";
        if (flagparams(_id)) {
            CNX.getCNX().query(CNX.getcorreosById(), [_id], (err, result) => {
                if (err) {
                    printQueryErrorMessage(res, err, _422err, 422);
                } else if (result.length > 0) {
                    printSuccessMessage(res, 'Correos', result);
                } else {
                    printQueryErrorMessage(res, "", _404err, 404);
                }
            });
        } else {
            printGlobalErrorMessage(res);
        }
    });
    app.put('/api/updcorreo', cors(), (req, res) => {
        let _id = req.body.id || "";
        let _depto = req.body.depto || "";
        let _correo = req.body.correo || "";
        let _descripcion = req.body.descripcion || "";
        if (flagparams(_id) && flagparams(_depto) && emailparam(_correo)) {
            CNX.getCNX().beginTransaction(err => {
                if (err) {
                    printTransactionErrorMessage(_res, err);
                } else {
                    CNX.getCNX().query(CNX.updateCorreos(), [_depto, _correo, _descripcion, _id], (err, result, fields) => {
                        if (err) {
                            saveLog(PROP.errorLog() + _406err + ' ' + err);
                            CNX.getCNX().rollback(err => {
                                if (err) {
                                    console.error('Rollback:' + err);
                                }
                                res.status(406).json({ result: _406err });
                            });
                        } else if (result.affectedRows > 0) {
                            CNX.getCNX().commit(err => {
                                if (err) {
                                    printCommitErrorMessage(res, err);
                                } else {
                                    printUpdateSuccessMessage(res, result);
                                }
                            });
                        } else {
                            printUpdateErrorMessage(res, result);
                        }
                    });
                }
            });
        } else {
            printGlobalErrorMessage(res);
        }
    });
    app.post('/api/newcorreo', cors(), (req, res) => {
        let _id = req.body.id || "";
        let _depto = req.body.depto || "";
        let _correo = req.body.correo || "";
        let _descripcion = req.body.descripcion || "";
        if (flagparams(_id) && flagparams(_depto) && emailparam(_correo)) {
            CNX.getCNX().beginTransaction(err => {
                if (err) {
                    printTransactionErrorMessage(res, err);
                } else {
                    CNX.getCNX().query(CNX.newCorreos(), [_id, _depto, _correo, _descripcion], (err, result, fields) => {
                        if (err) {
                            saveLog(PROP.errorLog() + _406err + ' ' + err);
                            CNX.getCNX().rollback(err => {
                                if (err) {
                                    console.error('Rollback:' + err);
                                }
                                res.status(406).json({ result: _406err });
                            });
                        } else if (result.affectedRows > 0) {
                            CNX.getCNX().commit(err => {
                                if (err) {
                                    printCommitErrorMessage(res, err);
                                } else {
                                    printInsertSuccessMessage(res, result);
                                }
                            });
                        } else {
                            printInsertErrorMessage(res, result);
                        }
                    });
                }
            });
        } else {
            printGlobalErrorMessage(res);
        }
    });
    //****************************** Chequera Entity actions *************************************
    app.get('/api/cheques', cors(), (req, res) => {
        CNX.getCNX().query(CNX.getallCheques(), (err, result) => {
            if (err) {
                printQueryErrorMessage(res, err, _422err, 422);
            } else if (result.length > 0) {
                printSuccessMessage(res, 'Estatus', result);
            } else {
                printQueryErrorMessage(res, "", _404err, 404);
            }
        });
    });
    app.get('/api/cheque/:id', cors(), (req, res) => {
        let _id = req.params.id || "";
        if (flagparams(_id)) {
            CNX.getCNX().query(CNX.getchequeById(), [_id], (err, result) => {
                if (err) {
                    printQueryErrorMessage(res, err, _422err, 422);
                } else if (result.length > 0) {
                    printSuccessMessage(res, 'Estatus', result);
                } else {
                    printQueryErrorMessage(res, "", _404err, 404);
                }
            });
        } else {
            printGlobalErrorMessage(res);
        }
    });
    app.put('/api/updchequera/', cors(), (req, res) => {
        let _id = req.body.id || "";
        let _bancoId = req.body.bancoId || "";
        let _cuenta = req.body.cuenta || "";
        let _chequeini = req.body.chequeini || "";
        let _chequefin = req.body.chequefin || "";
        let _chequeact = req.body.chequeact || "";
        let _admones = req.body.admones || "";
        let _estatus = req.body.estatus || "";
        if (flagparams(_id) && flagparams(_bancoId) && flagparams(_chequeini) && flagparams(_chequefin) && flagparams(_chequeact) && flagparams(_estatus)) {
            CNX.getCNX().beginTransaction(err => {
                if (err) {
                    printTransactionErrorMessage(res, err);
                } else {
                    CNX.getCNX().query(CNX.updateChequera(), [_bancoId, _cuenta, _chequeini, _chequefin, _chequeact, _admones, _estatus], (err, result, fields) => {
                        if (err) {
                            saveLog(PROP.errorLog() + _422err + ' ' + err);
                            CNX.getCNX().rollback(err => {
                                if (err) {
                                    console.error('Rollback: ' + err);
                                }
                                res.status(406).json({ result: _406err });
                            });
                        } else if (result.affectedRows > 0) {
                            CNX.getCNX().commit(err => {
                                if (err) {
                                    printCommitErrorMessage(res, err);
                                } else {
                                    printUpdateSuccessMessage(res, result);
                                }
                            });
                        } else {
                            printUpdateErrorMessage(res, result);
                        }
                    });
                }
            });
        } else {
            printGlobalErrorMessage(res);
        }
    });
    app.post('/api/newchequera', cors(), (req, res) => {
        let _id = req.body.id || "";
        let _bancoId = req.body.bancoId || "";
        let _cuenta = req.body.cuenta || "";
        let _chequeini = req.body.chequeini || "";
        let _chequefin = req.body.chequefin || "";
        let _chequeact = req.body.chequeact || "";
        let _admones = req.body.admones || "";
        let _estatus = req.body.estatus || "";
        if (flagparams(_id) && flagparams(_bancoId) && flagparams(_chequeini) && flagparams(_chequefin) && flagparams(_chequeact) && flagparams(_estatus)) {
            CNX.getCNX().beginTransaction(err => {
                if (err) {
                    printTransactionErrorMessage(res, err);
                } else {
                    CNX.getCNX().query(CNX.newChequera(), [_id, _bancoId, _cuenta, _chequeini, _chequefin, _chequeact, _admones, _estatus], (err, result, fields) => {
                        if (err) {
                            saveLog(PROP.errorLog() + _406err + ' ' + err);
                            CNX.getCNX().rollback(err => {
                                if (err) {
                                    console.error('Rollback:' + err);
                                }
                                res.status(406).json({ result: _406err });
                            });
                        } else if (result.affectedRows > 0) {
                            CNX.getCNX().commit(err => {
                                if (err) {
                                    printCommitErrorMessage(res, err);
                                } else {
                                    printInsertSuccessMessage(res, result);
                                }
                            });
                        } else {
                            printInsertErrorMessage(res, result);
                        }
                    });
                }
            });
        } else {
            printGlobalErrorMessage(res);
        }
    });
    //****************************** Nivel de Permiso Entity actions *************************************
    app.get('/api/nivelpermisos', cors(), (req, res) => {
        CNX.getCNX().query(CNX.getallNIvelesPermiso(), (err, result) => {
            if (err) {
                printQueryErrorMessage(res, err, _422err, 422);
            } else if (result.length > 0) {
                printSuccessMessage(res, 'Nivel Permiso', result);
            } else {
                printQueryErrorMessage(res, "", _404err, 404);
            }
        });
    });
    app.get('/api/nivelpermiso/:id', cors(), (req, res) => {
        let _id = req.params.id || "";
        if (flagparams(_id)) {
            CNX.getCNX().query(CNX.getnivelpermisoById(), [_id], (err, result) => {
                if (err) {
                    printQueryErrorMessage(res, err, _422err, 422);
                } else if (result.length > 0) {
                    printSuccessMessage(res, 'Nivel Permiso', result);
                } else {
                    printQueryErrorMessage(res, "", _404err, 404);
                }
            });
        } else {
            printGlobalErrorMessage(res);
        }
    });
    app.put('/api/updnivelpermiso/', cors(), (req, res) => {
        let _id = req.body.id || "";
        let _desc = req.body.descripcion || "";
        let _nivelpermiso = req.body.nivelpermiso || "";
        if (flagparams(_id) && flagparams(_nivelpermiso)) {
            CNX.getCNX().beginTransaction(err => {
                if (err) {
                    printTransactionErrorMessage(res, err);
                } else {
                    CNX.getCNX().query(CNX.updateNivelPermiso(), [_desc, _nivelpermiso, _id], (err, result, fields) => {
                        if (err) {
                            saveLog(PROP.errorLog() + _422err + ' ' + err);
                            CNX.getCNX().rollback(err => {
                                if (err) {
                                    console.error('Rollback:' + err);
                                }
                                res.status(406).json({ result: _406err });
                            });
                        } else if (result.affectedRows > 0) {
                            CNX.getCNX().commit(err => {
                                if (err) {
                                    printCommitErrorMessage(res, err);
                                } else {
                                    printUpdateSuccessMessage(res, result);
                                }
                            });
                        } else {
                            printUpdateErrorMessage(res, result);
                        }
                    });
                }
            });
        } else {
            printGlobalErrorMessage(res);
        }
    });
    app.post('/api/newnivelpermiso', cors(), (req, res) => {
        let _id = req.body.id || "";
        let _desc = req.body.descripcion || "";
        let _nivelpermiso = req.body.nivelpermiso || "";
        if (flagparams(_id) && flagparams(_nivelpermiso)) {
            CNX.getCNX().beginTransaction(err => {
                if (err) {
                    printTransactionErrorMessage(res, err);
                } else {
                    CNX.getCNX().query(CNX.newNivelPermiso(), [_id, _desc, _nivelpermiso], (err, result, fields) => {
                        if (err) {
                            saveLog(PROP.errorLog() + _406err + ' ' + err);
                            CNX.getCNX().rollback(err => {
                                if (err) {
                                    console.error('Rollback:' + err);
                                }
                                res.status(406).json({ result: _406err });
                            });
                        } else if (result.affectedRows > 0) {
                            CNX.getCNX().commit(err => {
                                if (err) {
                                    printCommitErrorMessage(res, err);
                                } else {
                                    printInsertSuccessMessage(res, result);
                                }
                            });
                        } else {
                            printInsertErrorMessage(res, result);
                        }
                    });
                }
            });
        } else {
            printGlobalErrorMessage(res);
        }
    });
    //****************************** Accesos Entity actions *************************************
    app.get('/api/accesos', cors(), (req, res) => {
        CNX.getCNX().query(CNX.getallAccesos(), (err, result) => {
            if (err) {
                printQueryErrorMessage(res, err, _422err, 422);
            } else if (result.length > 0) {
                printSuccessMessage(res, 'Accesos', result);
            } else {
                printQueryErrorMessage(res, "", _404err, 404);
            }
        });
    });
    app.get('/api/accesos/:id', cors(), (req, res) => {
        let _id = req.params.id || "";
        if (flagparams(_id)) {
            CNX.getCNX().query(CNX.getaccesoById(), [_id], (err, result) => {
                if (err) {
                    printQueryErrorMessage(res, err, _422err, 422);
                } else if (result.length > 0) {
                    printSuccessMessage(res, 'Accesos', result);
                } else {
                    printQueryErrorMessage(res, "", _404err, 404);
                }
            });
        } else {
            printGlobalErrorMessage(res);
        }
    });
    app.post('/api/accesos', cors(), (req, res) => {
        let _id = req.body.id || "";
        let _clavesecreta = secrethash(req.body.clavesecreta) || "";
        if (flagparams(_id) && _clavesecreta != "") {
            CNX.getCNX().query(CNX.getaccesoByIdSecret(), [_id, _clavesecreta], (err, result) => {
                if (err) {
                    printQueryErrorMessage(res, err, _422err, 422);
                } else if (result.length > 0) {
                    printSuccessMessage(res, 'Accesos', result);
                } else {
                    printQueryErrorMessage(res, "", _404err, 404);
                }
            });
        } else {
            printGlobalErrorMessage(res);
        }
    });
    app.put('/api/updacceso', cors(), (req, res) => {
        let _id = req.body.id || "";
        let _claveant = secrethash(req.body.claveant) || "";
        let _clavesecreta = secrethash(req.body.clavesecreta) || "";
        let _diasvigencia = req.body.diasvigencia || "";
        let _intentos = req.body.intentos || "";
        let _fechaclave = req.body.fechaclave || "NULL";
        let _fechabloqueo = req.body.fechabloqueo || "NULL";
        let _estatus = req.body.estatus || "";
        if (flagparams(_id) && flagparams(_diasvigencia) && flagparams(_intentos) && flagparams(_estatus) && _clavesecreta != "" && _claveant != "") {
            CNX.getCNX().beginTransaction(err => {
                if (err) {
                    printTransactionErrorMessage(res, err);
                } else {
                    CNX.getCNX().query(CNX.updateStatus(), [_clavesecreta, _diasvigencia, _intentos, _fechaclave, _fechabloqueo, _estatus, _id, _claveant], (err, result, fields) => {
                        if (err) {
                            saveLog(PROP.errorLog() + _422err + ' ' + err);
                            CNX.getCNX().rollback(err => {
                                if (err) {
                                    console.error('Rollback:' + err);
                                }
                                res.status(406).json({ result: _406err });
                            });
                        } else if (result.affectedRows > 0) {
                            CNX.getCNX().commit(err => {
                                if (err) {
                                    printCommitErrorMessage(res, err);
                                } else {
                                    printUpdateSuccessMessage(res, result);
                                }
                            });
                        } else {
                            printUpdateErrorMessage(res, result);
                        }
                    });
                }
            });
        } else {
            printGlobalErrorMessage(res);
        }
    });
    app.post('/api/newacceso', cors(), (req, res) => {
        let _id = req.body.id || "";
        let _clavesecreta = secrethash(req.body.clavesecreta) || "";
        let _diasvigencia = req.body.diasvigencia || "";
        let _intentos = req.body.intentos || "";
        let _estatus = req.body.estatus || "";
        if (flagparams(_id) && flagparams(_diasvigencia) && flagparams(_intentos) && flagparams(_estatus) && _clavesecreta != "") {
            CNX.getCNX().beginTransaction(err => {
                if (err) {
                    printTransactionErrorMessage(res, err);
                } else {
                    CNX.getCNX().query(CNX.newAcceso(), [_id, _clavesecreta, _diasvigencia, _intentos, _estatus], (err, result, fields) => {
                        if (err) {
                            saveLog(PROP.errorLog() + _422err + ' ' + err);
                            CNX.getCNX().rollback(err => {
                                if (err) {
                                    console.error('Rollback:' + err);
                                }
                                res.status(406).json({ result: _406err });
                            });
                        } else if (result.affectedRows > 0) {
                            CNX.getCNX().commit(err => {
                                if (err) {
                                    printCommitErrorMessage(res, err);
                                } else {
                                    printInsertSuccessMessage(res, result);
                                }
                            });
                        } else {
                            printInsertErrorMessage(res, result);
                        }
                    });
                }
            });
        } else {
            printGlobalErrorMessage(res);
        }
    });
}