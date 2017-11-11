var fmc = require('../fmc.js');

module.exports = function(controller) {

    if (!process.env.fmc_user) {
        console.log('Error: Specify a fmc_user in environment.');
        process.exit(1);
    }
 
    if (!process.env.fmc_password) {
        console.log('Error: Specify a fmc_password in environment.');
        process.exit(1);
    }
    
    if (!process.env.fmc_host) {
        console.log('Error: Specify a fmc_host in environment.');
        process.exit(1);
    }
   
    const options = {
        fmchost: process.env.fmc_host,
        username: process.env.fmc_user,
        password: process.env.fmc_password
    };
    
    fmc.init(options);

    function showBlacklist(bot, message, objId) {

        fmc.getNetworkObj(objId).then(function (response) {
            var blacklist = response.literals;
            var output = 'Current blacklist entries:\n';
            blacklist.forEach(function (address) {
                 output = output.concat('- ' + address.type + ' ' + address.value + '\n');
            });
            bot.reply(message, output);
        }).catch(function (err) {
            bot.reply(message, 'Error occured getting blacklist: ' + err);
        });
        
    }

    function addBlacklistEntry(bot, message, objId, address) {

        var entry = {
            type: 'Host',
            value: address
        };
        
        fmc.getNetworkObj(objId).then(function (response) {
            var blacklist = response.literals;
            blacklist.push(entry);
            var groupObject = {
                literals: blacklist,
                id: objId,
                name: response.name,
                type: response.type
            };

            fmc.putNetworkObj(objId, groupObject).then(function (response) {
                bot.reply(message, 'Successfully added address ' + address + ' to blacklist');
            }).catch(function (err) {
                bot.reply(message, 'Error adding entry to blacklist: ' + err);
            });

        }).catch(function (err) {
            bot.reply(message, 'Error occured getting blacklist: ' + err);
        });
        
    }

    function deleteBlacklistEntry(bot, message, objId, address) {

        fmc.getNetworkObj(objId).then(function (response) {
            var currentList = response.literals;
            var newList = [];
            console.log(currentList);
            currentList.forEach(function (entry) {
                if(entry.value != address)
                    newList.push(entry);
            });
            console.log(newList);
            var groupObject = {
                literals: newList,
                id: objId,
                name: response.name,
                type: response.type
            };

            fmc.putNetworkObj(objId, groupObject).then(function (response) {
                bot.reply(message, 'Successfully removed address ' + address + ' from blacklist');
            }).catch(function (err) {
                bot.reply(message, 'Error removing entry from blacklist: ' + err);
            });

        }).catch(function (err) {
            bot.reply(message, 'Error occured getting blacklist: ' + err);
        });
        
    }

    function showDeployments(bot, message) {

        fmc.getDeployments().then(function (response) {
            var deployments = response.items;
            if (deployments) {
                var output = 'Currently available deployments:\n';
                console.log(deployments);
                deployments.forEach(function (item) {
                     output = output.concat('- ' + item.name + '\n');
                });
                bot.reply(message, output);
            } else {
                bot.reply(message, 'No deployments are currently available');
            }
        }).catch(function (err) {
            bot.reply(message, 'Error occured getting deployments: ' + err);
        });
        
    }
    
    function deployResult(task, bot, message) {
        if(task.status == 'Deployed')
            bot.reply(message, 'Task ID ' + task.id + ' completed successfully.');
        else
            bot.reply(message, 'Task ID ' + task.id + ' failed.');
    }

    function deploy(bot, message) {

        fmc.deploy().then(function (response) {
            fmc.taskStatus(response.metadata.task.id, deployResult, bot, message);
            bot.reply(message, 'Successfully started deployment. Task ID is ' + response.metadata.task.id + '.');
        }).catch(function (err) {
            bot.reply(message, 'Error occured starting deployment: ' + err);
        });
        
    }

    controller.hears(['^show blacklist$'], 'direct_message,direct_mention', function(bot, message) {
        showBlacklist(bot, message, '005056A4-26A2-0ed3-0000-240518169442');
    });

    controller.hears(['^blacklist add (.*)'], 'direct_message,direct_mention', function(bot, message) {
        addBlacklistEntry(bot, message, '005056A4-26A2-0ed3-0000-240518169442', message.match[1]);
    });

    controller.hears(['^blacklist delete (.*)'], 'direct_message,direct_mention', function(bot, message) {
        deleteBlacklistEntry(bot, message, '005056A4-26A2-0ed3-0000-240518169442', message.match[1]);
    });

    controller.hears(['^show deployments$'], 'direct_message,direct_mention', function(bot, message) {
        showDeployments(bot, message);
    });

    controller.hears(['^deploy$'], 'direct_message,direct_mention', function(bot, message) {
        deploy(bot, message);
    });

};