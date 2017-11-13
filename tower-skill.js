var tower = require('../tower.js');
var generator = require('generate-password');

module.exports = function(controller) {

    if (!process.env.tower_user) {
        console.log('Error: Specify a tower_user in environment.');
        process.exit(1);
    }
 
    if (!process.env.tower_password) {
        console.log('Error: Specify a tower_password in environment.');
        process.exit(1);
    }
    
     if (!process.env.tower_host) {
        console.log('Error: Specify a tower_host in environment.');
        process.exit(1);
    }
    
    const options = {
        towerhost: process.env.tower_host,
        username: process.env.tower_user,
        password: process.env.tower_password
    };
    
    tower.init(options);
    
    function jobResult(job, bot, message) {
        if(job.status == 'successful')
            bot.reply(message, 'Job ' + job.id + ' completed successfully.');
        else
            bot.reply(message, 'Job ' + job.id + ' failed.');
    }

    controller.hears(['^record add external (.*) (.*)'], 'direct_message,direct_mention', function(bot, message) {
        let vars = 'name: ' + message.match[1] + '\nip: ' + message.match[2];
        tower.startJob('dnsimple-record-add', vars).then( function (job) {
            bot.reply(message, 'Successfully queued Job ' + job.id + ' to add DNS record ' + message.match[1] + ' ip ' + message.match[2]);
            tower.getJobResult(job.id, jobResult, bot, message);
        });
    });

    controller.hears(['^record delete external (.*) (.*)'], 'direct_message,direct_mention', function(bot, message) {
        let vars = 'name: ' + message.match[1] + '\nip: ' + message.match[2];
        tower.startJob('dnsimple-record-delete', vars).then( function (job) {
            bot.reply(message, 'Successfully queued Job ' + job.id + ' to remove DNS record ' + message.match[1] + ' ip ' + message.match[2]);
            tower.getJobResult(job.id, jobResult, bot, message);
        });
    });

    controller.hears(['^record add internal (.*) (.*)'], 'direct_message,direct_mention', function(bot, message) {
        let vars = 'name: ' + message.match[1] + '\nip: ' + message.match[2];
        tower.startJob('windows-dns-add', vars).then( function (job) {
            bot.reply(message, 'Successfully queued Job ' + job.id + ' to add DNS record ' + message.match[1] + ' ip ' + message.match[2]);
            tower.getJobResult(job.id, jobResult, bot, message);
        });
    });

    controller.hears(['^record delete internal (.*) (.*)'], 'direct_message,direct_mention', function(bot, message) {
        let vars = 'name: ' + message.match[1] + '\nip: ' + message.match[2];
        tower.startJob('windows-dns-delete', vars).then( function (job) {
            bot.reply(message, 'Successfully queued Job ' + job.id + ' to remove DNS record ' + message.match[1] + ' ip ' + message.match[2]);
            tower.getJobResult(job.id, jobResult, bot, message);
        });
    });
    
    controller.hears(['^user add (.*) password (.*)'], 'direct_message,direct_mention', function(bot, message) {
        let vars = 'logon: ' + message.match[1] + '\npassword: ' + message.match[2];
        tower.startJob('windows-user-add', vars).then( function (job) {
            bot.reply(message, 'Successfully queued Job ' + job.id + ' to add user ' + message.match[1] + ' with password ' + message.match[2]);
            tower.getJobResult(job.id, jobResult, bot, message);
        });
    });

    controller.hears(['^user add (.*)$'], 'direct_message,direct_mention', function(bot, message) {
		let passwd = generator.generate({
			length: 10, 
			numbers: true
		});
        let vars = 'logon: ' + message.match[1] + '\npassword: ' + passwd;
        tower.startJob('windows-user-add', vars).then( function (job) {
            bot.reply(message, 'Successfully queued Job ' + job.id + ' to add user ' + message.match[1] + ' with password ' + passwd);
            tower.getJobResult(job.id, jobResult, bot, message);
        });
    });

    controller.hears(['^user delete (.*)'], 'direct_message,direct_mention', function(bot, message) {
        let vars = 'logon: ' + message.match[1];
        tower.startJob('windows-user-delete', vars).then( function (job) {
            bot.reply(message, 'Successfully queued Job ' + job.id + ' to delete user ' + message.match[1]);
            tower.getJobResult(job.id, jobResult, bot, message);
        });
    });

    controller.hears(['^user modify (.*) password (.*)'], 'direct_message,direct_mention', function(bot, message) {
        let vars = 'logon: ' + message.match[1] + '\npassword: ' + message.match[2];
        tower.startJob('windows-user-modify-password', vars).then( function (job) {
            bot.reply(message, 'Successfully queued Job ' + job.id + ' to modify password for user ' + message.match[1]);
            tower.getJobResult(job.id, jobResult, bot, message);
        });
    });

    controller.hears(['^user disable (.*)'], 'direct_message,direct_mention', function(bot, message) {
        let vars = 'logon: ' + message.match[1];
        tower.startJob('windows-user-disable', vars).then( function (job) {
            bot.reply(message, 'Successfully queued Job ' + job.id + ' to disable user ' + message.match[1]);
            tower.getJobResult(job.id, jobResult, bot, message);
        });
    });

    controller.hears(['^user enable (.*)'], 'direct_message,direct_mention', function(bot, message) {
        let vars = 'logon: ' + message.match[1];
        tower.startJob('windows-user-enable', vars).then( function (job) {
            bot.reply(message, 'Successfully queued Job ' + job.id + ' to enable user ' + message.match[1]);
            tower.getJobResult(job.id, jobResult, bot, message);
        });
    });

    controller.hears(['^get last (.*) jobs$'], 'direct_message,direct_mention', function(bot, message) {
        tower.getJobs(message.match[1]).then( function (jobs) {
            let output = 'Here is the status of the last ' + message.match[1] + ' jobs:\n';
            jobs.results.forEach(function(job) {
                output = output.concat('- job: ' + job.id + ', template: ' + job.name + ', status: ' + job.status + '\n');
            });
            bot.reply(message, output);
        });
    });

};
