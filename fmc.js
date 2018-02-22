var rp = require('request-promise');
var Promise = require('promise');
var debug = require('debug')('fmc');

var FMC_VARS = {
    authOptions: {},
    uri: '',
    token: {
        value: '',
        expires: ''
    }
};

function getToken() {
    return new Promise(function (resolve, reject) {
        rp(FMC_VARS.authOptions).then(function (response) {
            FMC_VARS.token.value = response.headers['x-auth-access-token'];
            debug('getToken: ' + FMC_VARS.token.value);
            resolve(response);
        }).catch(function (err) {
            reject(err);
        });
    });
}

exports.init = function(options) {

    FMC_VARS.uri = 'https://' + options.fmchost + '/api';
    FMC_VARS.authOptions = {
        method: 'POST',
        uri: FMC_VARS.uri + '/fmc_platform/v1/auth/generatetoken',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Basic ' + new Buffer(options.username + ':' + options.password).toString('base64')
            
        },
        json: true,
        rejectUnauthorized: false,
        resolveWithFullResponse: true
    };

};

function getObj(path, objId) {
        return new Promise(function (resolve, reject) {
        
            var options = {
                method: 'GET',
                uri: FMC_VARS.uri + '/fmc_config/v1/domain/default/object/' + path + '/' + objId,
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                json: true,
                rejectUnauthorized: false
            };

            getToken().then(function (response) {
                options.headers['X-auth-access-token'] = FMC_VARS.token.value;
                debug('getObj: ' + JSON.stringify(options));
                rp(options).then(function (response) {
                    resolve(response);
                }).catch(function (err) {
                    reject(err);
                });
            }).catch(function (err) {
                reject(err);
            });
        });
}

function putObj(path, objId, objData) {
    return new Promise(function (resolve, reject) {
    
        var options = {
            method: 'PUT',
            uri: FMC_VARS.uri + '/fmc_config/v1/domain/default/object/' + path + '/' + objId,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            json: true,
            rejectUnauthorized: false
        };

        getToken().then(function (response) {
            options.headers['X-auth-access-token'] = FMC_VARS.token.value;
            options.body = objData;
            debug('putObj: ' + JSON.stringify(options));
            rp(options).then(function (response) {
                resolve(response);
            }).catch(function (err) {
                reject(err);
            });
        }).catch(function (err) {
            reject(err);
        });
    });
}
    
exports.getNetworkObj = function (objId) {
        return new Promise(function (resolve, reject) {
            debug('getNetworkObj: ' + JSON.stringify(objId));
            getObj('networkgroups', objId).then(function (response) {
                resolve(response);
            }).catch(function (err) {
                reject(err);
            });
        });
};

exports.putNetworkObj = function(objId, obj) {
    return new Promise(function (resolve, reject) {
    
        putObj('networkgroups', objId, obj).then(function (response) {
            resolve(response);
        }).catch(function (err) {
            reject(err);
        });
    });
};

exports.getDeployments = function() {
    return new Promise(function (resolve, reject) {
    
        var options = {
            method: 'GET',
            uri: FMC_VARS.uri + '/fmc_config/v1/domain/default/deployment/deployabledevices',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            json: true,
            rejectUnauthorized: false
        };

        getToken().then(function (response) {
            options.headers['X-auth-access-token'] = FMC_VARS.token.value;
            rp(options).then(function (response) {
                resolve(response);
            }).catch(function (err) {
                reject(err);
            });
        }).catch(function (err) {
            reject(err);
        });
    });
};
    
exports.taskStatus = function(taskId, callback) {

    // extract extra callback arguments
    var args = Array.prototype.splice.call(arguments, 2);

    var options = {
        method: 'GET',
        uri: FMC_VARS.uri + '/fmc_config/v1/domain/default/job/taskstatuses/' + taskId,
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
        json: true,
        rejectUnauthorized: false
    };

    let delay = 2000; // check job status every two seconds
    
    setTimeout(function request() {
        getToken().then(function (response) {
            options.headers['X-auth-access-token'] = FMC_VARS.token.value;
            rp(options).then(function (response) {
                if(['Deployed'].includes(response.status)) {
                    if (args) {
                        args.unshift(response); // insert job data into args
                        callback.apply(null, args);
                    } else {
                        callback(response);
                    }
                } else {
                    setTimeout(request, delay);
                }
            }).catch(function (err) {
                console.log('Error occurred checking task status ' + err);
            });
        }).catch( function (err) {
            console.log('Error occurred requesting token ' + err);
        });
    }, delay);

};
    
exports.deploy = function() {
    return new Promise(function (resolve, reject) {
        // The FMC API requires us to pass the current timestamp in UTC as the 'version' in our request data
        var timestamp = new Date().getTime();

        var deployRequest = {
            type: 'DeploymentRequest',
            version: timestamp,
            forceDeploy: 'true',
            ignoreWarning: 'true',
            deviceList: [
                '177b17b6-3a8c-11e6-b8fb-f62ef8b1fa4d'
            ]
        };
        
        var options = {
            method: 'POST',
            uri: FMC_VARS.uri + '/fmc_config/v1/domain/default/deployment/deploymentrequests',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            json: true,
            rejectUnauthorized: false
        };

        getToken().then(function (response) {
            options.headers['X-auth-access-token'] = FMC_VARS.token.value;
            options.body = deployRequest;
            rp(options).then(function (response) {
                resolve(response);
            }).catch(function (err) {
                reject(err);
            });
        }).catch(function (err) {
            reject(err);
        });
    });
};