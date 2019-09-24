'use strict';
require('dotenv/config');
//const shell = require('shelljs');
const mysql = require('mariadb/callback');
//Query definitions
const cat01_qry = "SELECT estatus_ID as estatus, cd_descripcion as descripcion FROM cat01_estatus";
const cat01_qryId = cat01_qry + " WHERE estatus_ID = ?";
const cat01_updateId = "UPDATE cat01_estatus SET cd_descripcion = ? WHERE estatus_ID = ?";

const cat02_qry = "SELECT a.depto_ID as deptoId, a.cd_titulares as titulares, a.nu_piso as piso, b.cd_descripcion as descripcion, a.condomino_ID, c.cd_descripcion from cat02_condominos a INNER JOIN cat06_niveles_acceso b ON a.nivel_acceso_ID = b.nivel_acceso_ID INNER JOIN cat01_estatus c ON a.estatus_ID = c.estatus_ID AND a.estatus_ID = 1 ";
const cat02_qryId = cat02_qry + "WHERE depto_ID = ?";
const cat02_updateId = "UPDATE cat02_condominos SET cd_titulares = ?, nu_piso = ? , nivel_acceso_ID = ?, condomino_ID = ?, estatus_ID = ? WHERE depto_ID = ? AND estatus_ID = 1";
const cat02_insert = "INSERT INTO cat02_condominos VALUES(?, ?, ?, CURRENT_TIMESTAMP(), ?, ?, ?)";

const cat03_qry = "SELECT correo_ID as Id, depto_ID as depto, cd_correo as correo, cd_descripcion as descripcion FROM cat03_correos ";
const cat03_qryId = cat03_qry + " WHERE correo_ID = ?";
const cat03_updateId = "UPDATE cat03_correos SET depto_ID = ?, cd_correo = ?, cd_descripcion = ? WHERE correo_ID = ?";
const cat03_insert = "INSERT INTO cat03_correos VALUES(?, ?, ?, ?)";

const cat04_qry = "SELECT a.chequera_ID as chequeraID, c.cd_nombre_banco as banco, a.cd_banco_cuenta as cuenta, a.nu_cheque_inicial as chequeini, a.nu_cheque_final as chequefin, a.nu_cheque_actual as chequeactual, a.cd_administradores_cta as administradores, b.cd_descripcion FROM cat04_chequera a INNER JOIN cat01_estatus b ON a.estatus_ID = b.estatus_ID INNER JOIN cat10_bancos c ON a.banco_ID = c.banco_ID AND a.estatus_ID = 1 ";
const cat04_qryId = cat04_qry + "WHERE a.chequera_ID = ?";
const cat04_update = "UPDATE cat04_chequera SET banco_ID = ?, cd_banco_cuenta = ?, nu_cheque_inicial = ?, nu_cheque_final = ?, nu_cheque_actual = ?, cd_administradores_cta = ?, estatus_ID = ? WHERE estatus_ID = 1";
const cat04_insert = "INSERT INTO cat04_chequera VALUES(?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP(), ?)";

const cat05_qry = "SELECT a.estado_ciudad_ID as edoId, a.cd_nombre_estado as nombre, b.cd_nombre_pais as pais, c.cd_descripcion as estatus FROM cat05_estados a INNER JOIN cat09_paises b ON a.pais_ID=b.pais_ID INNER JOIN cat01_estatus c ON a.estatus_ID=c.estatus_ID AND a.estatus_ID = 1 ";
const cat05_qryId = cat05_qry + "WHERE a.estado_ciudad_ID = ?";
const cat05_updateId = "UPDATE cat05_estados SET cd_nombre_estado = ? WHERE estado_ciudad_ID = ? AND estatus_ID = 1";

const cat06_qry = "SELECT a.nivel_acceso_ID as accesoID, a.cd_descripcion as descripcion, b.cd_descripcion as estatus FROM cat06_niveles_acceso a INNER JOIN cat01_estatus b ON a.estatus_ID = b.estatus_ID AND a.estatus_ID = 1 ";
const cat06_qryId = cat06_qry + "WHERE a.nivel_acceso_ID = ?";
const cat06_updateId = "UPDATE cat06_niveles_acceso SET cd_descripcion = ?, estatus_ID = ? WHERE nivel_acceso_ID = ? AND estatus_ID = 1";
const cat06_insert = "INSERT INTO cat06_niveles_acceso VALUES(?, ?, CURRENT_TIMESTAMP(), ?)";

const cat07_qry = "SELECT a.permiso_ID as permisoId, a.cd_descripcion as descripcionpermiso, b.cd_descripcion as descripcionacceso, b.estatus_ID as estatus FROM cat07_niveles_permiso a INNER JOIN cat06_niveles_acceso b ON a.nivel_acceso_ID = b.nivel_acceso_ID AND b.estatus_ID = 1 ";
const cat07_qryId = cat07_qry + "WHERE a.permiso_ID = ?";
const cat07_updateId = "UPDATE cat07_niveles_permiso SET cd_descripcion = ?, nivel_acceso_ID = ? WHERE permiso_ID = ?";
const cat07_insert = "INSERT INTO cat07_niveles_permiso VALUES(?, ?, CURRENT_TIMESTAMP(), (SELECT nivel_acceso_ID FROM cat06_niveles_acceso WHERE nivel_acceso_ID = ? AND estatus_ID = 1))";

const cat09_qry = "SELECT a.pais_ID as pais, a.cd_nombre_pais as nombre_pais, b.cd_descripcion FROM cat09_paises a INNER JOIN cat01_estatus b ON a.estatus_ID = b.estatus_ID AND a.estatus_ID = 1 ";
const cat09_qryId = cat09_qry + "WHERE a.pais_ID = ?";
const cat09_updateId = "UPDATE cat09_paises SET cd_nombre_pais = ?, estatus_ID = ? WHERE pais_ID = ? AND estatus_ID = 1";
const cat09_insert = "INSERT INTO cat09_paises VALUES (?, ?, CURRENT_TIMESTAMP(), ?)";

const cat10_qry = "SELECT a.banco_ID as bancoId, a.cd_nombre_banco as banco, a.cd_banco_ref as referencia, b.cd_descripcion as estatus FROM cat10_bancos a INNER JOIN cat01_estatus b ON a.estatus_ID = b.estatus_ID AND a.estatus_ID = 1 ";
const cat10_qryId = cat10_qry + "WHERE a.banco_ID = ?";
const cat10_updateId = "UPDATE cat10_bancos SET cd_nombre_banco = ?, cd_banco_ref = ?, estatus_ID = ? WHERE banco_ID = ? AND estatus_ID = 1";
const cat10_insert = "INSERT INTO cat10_bancos VALUES (?, ?, ?, CURRENT_TIMESTAMP(), ?)";

const cat11_qry = "SELECT a.demarcacion_ID as demarcacionId, a.cd_demarcacion as demarcacion, b.cd_descripcion as estatus, c.cd_nombre_estado as estado FROM cat11_municipios a INNER JOIN cat01_estatus b ON a.estatus_ID = b.estatus_ID INNER JOIN cat05_estados c ON a.estado_ciudad_ID = c.estado_ciudad_ID AND a.estatus_ID = 1 ";
const cat11_qryId = cat11_qry + "WHERE a.demarcacion_ID = ?";
const cat11_updateId = "UPDATE cat11_municipios SET cd_demarcacion = ?, estatus_ID = ? WHERE demarcacion_ID = ? AND estatus_ID = 1";
const cat11_insert = "INSERT INTO cat11_municipios VALUES (?, ?, CURRENT_TIMESTAMP(), ?, ?)";

const tbl02_qry = "SELECT a.condominio_ID as condiminio, a.cd_nombre_condomino as nombre, a.cd_num_ext as exterior, a.cd_ubicacion as ubicacion, a.cd_colonia as colonia, a.cd_codigo_postal as postal, b.cd_demarcacion as demarcacion, b.cd_nombre_estado as estado FROM tbl02_condominios a INNER JOIN (SELECT a.demarcacion_ID,a.cd_demarcacion,b.estado_ciudad_ID,b.cd_nombre_estado FROM cat11_municipios a INNER JOIN cat05_estados b ON a.estado_ciudad_ID = b.estado_ciudad_ID) b ON a.demarcacion_ID = b.demarcacion_ID AND a.estado_ciudad_ID = b.estado_ciudad_ID AND a.estatus_ID = 1 ";
const tbl02_qryId = tbl02_qry + "WHERE a.condominio_ID = ?";
const tbl02_updateId = "UPDATE tbl02_condominios SET cd_nombre_condomino = ?, cd_num_ext = ?, cd_ubicacion = ?, cd_colonia = ?, cd_codigo_postal = ?, demarcacion_ID = ?, estado_ciudad_ID = ?, estatus_ID = ? WHERE condominio_ID = ? AND estatus_ID = 1";
const tbl02_insert = "INSERT INTO tbl02_condominios VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?)";

const tbl03_qry = "SELECT a.depto_ID as deptoId, a.cd_clave_secreta as clave, a.nu_dias_vigencia as diasvigencia, a.nu_intentos as intentos, a.fh_fecha_clave_secreta as fechaclave, a.fh_fecha_actualizacion as fechaactualiza, a.fh_fecha_bloqueo as fechabloqueo, b.cd_descripcion as estatus FROM tbl03_acceso a INNER JOIN cat01_estatus b ON a.estatus_ID = b.estatus_ID ";
const tbl03_qryId = tbl03_qry + "WHERE a.depto_ID = ?";
const tbl03_qryIdSecret = tbl03_qry + "WHERE a.depto_ID = ? and a.cd_clave_secreta = ?";
const tbl03_updateId = "UPDATE tbl03_acceso SET cd_clave_secreta = ?, nu_dias_vigencia = ?, nu_intentos = ?, fh_fecha_clave_secreta = ?, fh_fecha_actualizacion = CURRENT_TIMESTAMP(), fh_fecha_bloqueo = ?, estatus_ID = ? WHERE depto_ID = ? AND cd_clave_secreta = ?";
const tbl03_insert = "INSERT INTO tbl03_acceso VALUES(?, ?, ?, ?, CURRENT_TIMESTAMP(), NULL, NULL, ?)";
//Init Object properties
var _db;
var PROP = require('./properties');
var CNX = {
    initilizeDB: () => {
        //Fetching credentials
        //const _query = shell.exec('grep -w "cat01" config.cfg | cut -d"=" -f2', { silent: true }).stdout;
        //shell.exec('openssl rsautl -decrypt -inkey ./assets/.private.pem -in ./assets/.claves.ssl -out decrypted');
        // const _dbhost = shell.exec('cat decrypted|cut -d":" -f1', { silent: true }).stdout;
        // const _dbuser = shell.exec('cat decrypted|cut -d":" -f2', { silent: true }).stdout;
        // const _dbpwd = shell.exec('cat decrypted|cut -d":" -f3', { silent: true }).stdout;
        // const _dbname = shell.exec('cat decrypted|cut -d":" -f4', { silent: true }).stdout;
        //Delete garbage
        //shell.rm('-f', 'decrypted');
        //Verify if db object exists
        if (_db == null) {
            //Create connection to database
            _db = mysql.createConnection('mariadb://' + process.env.DBUSR + ':' + process.env.DBPWD + '@' + process.env.DBHOST + ':' + process.env.DBPORT + '/' + process.env.DBNAME + '?debug=false');
            _db.connect((err) => {
                if (!err) {
                    console.log(PROP.infoLog() + 'Connected to database');
                } else {
                    console.error(PROP.errorLog() + err.stack);
                }
            });
        }
        global.db = _db;
        return;
    },
    closeDB: () => {
        db.destroy();
    },
    getCNX: () => {
        return db;
    },
    //Catalogo Estatus
    getallStatus: () => {
        return cat01_qry.toString();
    },
    getstatusById: () => {
        return cat01_qryId.toString();
    },
    updateStatus: () => {
        return cat01_updateId.toString();
    },
    //Catalogo Condomino
    getallCondominos: () => {
        return cat02_qry.toString();
    },
    getcondominoById: () => {
        return cat02_qryId.toString();
    },
    updateCondomino: () => {
        return cat02_updateId.toString();
    },
    newCondomino: () => {
        return cat02_insert.toString();
    },
    //Catalogo Correos
    getallCorreos: () => {
        return cat03_qry.toString();
    },
    getcorreosById: () => {
        return cat03_qryId.toString();
    },
    updateCorreos: () => {
        return cat03_updateId.toString();
    },
    newCorreos: () => {
        return cat03_insert.toString();
    },
    //Catalogo Chequera
    getallCheques: () => {
        return cat04_qry.toString();
    },
    getchequeById: () => {
        return cat04_qryId.toString();
    },
    updateChequera: () => {
        return cat04_update.toString();
    },
    newChequera: () => {
        return cat04_insert.toString();
    },
    //Catalogo Estados
    getallStates: () => {
        return cat05_qry.toString();
    },
    getstatesById: () => {
        return cat05_qryId.toString();
    },
    updateStates: () => {
        return cat05_updateId.toString();
    },
    //Catalogo Niveles de Acceso
    getallNivelesAcceso: () => {
        return cat06_qry.toString();
    },
    getnivelesaccessoById: () => {
        return cat06_qryId.toString();
    },
    updateNivelAcceso: () => {
        return cat06_updateId.toString();
    },
    newNivelAcceso: () => {
        return cat06_insert.toString();
    },
    // Catalogo Niveles de Permiso
    getallNIvelesPermiso: () => {
        return cat07_qry.toString();
    },
    getnivelpermisoById: () => {
        return cat07_qryId.toString();
    },
    updateNivelPermiso: () => {
        return cat07_updateId.toString();
    },
    newNivelPermiso: () => {
        return cat07_insert.toString();
    },
    //Catalogo Paises
    getallPaises: () => {
        return cat09_qry.toString();
    },
    getpaisById: () => {
        return cat09_qryId.toString();
    },
    updatePais: () => {
        return cat09_updateId.toString();
    },
    newPais: () => {
        return cat09_insert.toString();
    },
    //Catalogo Bancos
    getallBancos: () => {
        return cat10_qry.toString();
    },
    getbancoById: () => {
        return cat10_qryId.toString();
    },
    updateBanco: () => {
        return cat10_updateId.toString();
    },
    newBanco: () => {
        return cat10_insert.toString();
    },
    //Catalogo Municipios
    getallMunicipios: () => {
        return cat11_qry.toString();
    },
    getmunicipioById: () => {
        return cat11_qryId.toString();
    },
    updateMunicipio: () => {
        return cat11_updateId.toString();
    },
    newMunicipio: () => {
        return cat11_insert.toString();
    },
    //Tabla Condominios
    getallCondominios: () => {
        return tbl02_qry.toString();
    },
    getcondominioById: () => {
        return tbl02_qryId.toString();
    },
    updateCondiminio: () => {
        return tbl02_updateId.toString();
    },
    newCondominio: () => {
        return tbl02_insert.toString();
    },
    //Tabla Acceso
    getallAccesos: () => {
        return tbl03_qry.toString();
    },
    getaccesoById: () => {
        return tbl03_qryId.toString();
    },
    getaccesoByIdSecret: () => {
        return tbl03_qryIdSecret.toString();
    },
    updateAcceso: () => {
        return tbl03_updateId.toString();
    },
    newAcceso: () => {
        return tbl03_insert.toString();
    }
};
// Export global object
module.exports = CNX;