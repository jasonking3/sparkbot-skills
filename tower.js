var rp = require('request-promise');
var Promise = require('promise');
var debug = require('debug')('tower');

var TOWER_VARS = {
    authOptions: {},
    uri: '',
    token: {
        value: '',
        expires: ''
    }
};

// need to update this to be smarter about token caching and expiration
function getToken () {
    return new Promise(function (resolve, reject) {
        rp(TOWER_VARS.authOptions).then(function (response) {
            TOWER_VARS.token.value = response.token;
            TOWER_VARS.token.expires = response.expires;
            debug('getToken: ' + JSON.stringify(response));
            resolve(response);
        }).catch( function (err) {
            //console.log('Error occurred requesting token ' + err);
            reject(err);
        });
    });
}

function getTemplateId (templateName) {
    return new Promise(function (resolve, reject) {

        var options = {
            method: 'GET',
            uri: TOWER_VARS.uri + '/job_templates/?name=' + templateName,
            headers: {
                'Content-Type': 'application/json',
            },
            json: true
        };
    

        getToken().then(function (response) { // get new token
            options.headers.Authorization = 'Token ' + TOWER_VARS.token.value;
            rp(options).then(function (response) {
                debug('getTemplateID: ' + JSON.stringify(response));
                resolve(response.results[0].id);
            }).catch(function (err) {
                console.log('Error getting job template ' + err);
                reject(err);
            });
        }).catch(function (err) {
            console.log('Error occurred requesting token ' + err);
            reject(err);
        });
    });

}

exports.init = function (options) {

    TOWER_VARS.uri = 'http://' + options.towerhost + '/api/v1';
    TOWER_VARS.authOptions = {
        method: 'POST',
        uri: TOWER_VARS.uri + '/authtoken/',
        body: {
            'username': options.username,
            'password': options.password
        },
        json: true
    };

};

exports.startJob = function (template, vars) {    
    return new Promise(function (resolve, reject) {

        var options = {
            method: 'POST',
            body: {
                'extra_vars': vars
            },
            headers: {
                'Content-Type': 'application/json'
            },
            json: true
        };

        getToken().then(function (response) {
            options.headers.Authorization = 'Token ' + response.token;
            getTemplateId(template).then( function (id) {
                options.uri = TOWER_VARS.uri + '/job_templates/' + id 
                    + '/launch/';
                rp(options).then(function (response) {
                    debug('startJob: ' + JSON.stringify(response));
                    resolve(response);
                }).catch(function (err) {
                    console.log('Error starting job ' + err);
                    reject(err);
                });
            }).catch (function (err) {
                console.log('Error getting template id ' + err);
                reject(err);
            });
        }).catch(function (err) {
            console.log('Error occurred requesting token ' + err);
            reject(err);
        });
    });

};

exports.getJobs = function (limit, callback) {
    return new Promise(function (resolve, reject) {

        var options = {
            method: 'GET',
            uri: TOWER_VARS.uri + '/jobs/?page_size=' + limit + '&order_by=-id',
            headers: {
                'Content-Type': 'application/json'
            },
            json: true
        };

        getToken().then(function (response) {
            options.headers.Authorization = 'Token ' + response.token;
            rp(options).then(function (response) {
                resolve(response);
            }).catch(function (err) {
                console.log('Error occurred getting jobs ' + err);
                reject(err);
            });
        }).catch(function (err) {
            console.log('Error occurred requesting token ' + err);
            reject(err);
        });
    });
};

exports.getJobResult = function (jobId, callback) {

    // extract extra callback arguments
    var args = Array.prototype.splice.call(arguments, 2);

    var options = {
        method: 'GET',
        uri: TOWER_VARS.uri + '/jobs/' + jobId + '/',
        headers: {
            'Content-Type': 'application/json',
        },
        json: true
    };

    let delay = 2000; // check job status every two seconds
    
    setTimeout(function request() {
        getToken().then(function (response) {
            options.headers.Authorization = 'Token ' + response.token;
            rp(options).then(function (response) {
                if(['successful', 'failed'].includes(response.status)) {
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
                console.log('Error occurred checking job result ' + err);
            });
        }).catch( function (err) {
            console.log('Error occurred requesting token ' + err);
        });
    }, delay);

};
