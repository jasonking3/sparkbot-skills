var rp = require('request-promise');


module.exports = function(controller) {

    if (!process.env.dnsimple_user) {
        console.log('Error: Specify a dnsimple_user in environment.');
        process.exit(1);
    }
 
    if (!process.env.dnsimple_token) {
        console.log('Error: Specify a dnsimple_token in environment.');
        process.exit(1);
    }

    if (!process.env.dnsimple_domain) {
        console.log('Error: Specify a dnsimple_domain in environment.');
        process.exit(1);
    }

    function dnsimpleListRecords(bot, message, domain) {

        var options = {
            method: 'GET',
            uri: 'https://api.dnsimple.com/v1/domains/' + domain + '/records',
            headers: {
                'X-DNSimple-Token': process.env.dnsimple_user + ':' + process.env.dnsimple_token,
                'Accept': 'application/json'
            },
            json: true
        };
        rp(options).then(function (response) {
            response = JSON.stringify(response);
            var records = JSON.parse(response);
            var count = Object.keys(records).length;
            var output = 'Found' + count + ' records.\n';
            records.forEach(function(record) {
                if(record.record.record_type == 'A')
                    output = output.concat('- ' + record.record.name + ' ' + record.record.content + '\n');
            });
            bot.reply(message, output);
        }).catch(function (err) {
            console.log('Error occured listing dnsimple records ' + err);
        });
    }

    controller.hears(['^record list$', 'show records'], 'direct_message,direct_mention', function(bot, message) {
        dnsimpleListRecords(bot, message, process.env.dnsimple_domain);
    });

};