var request = require('request');
var config = require('../../config/config')
var env = process.env.NODE_ENV || 'development';
var key = config[env].mailgun.apiKey;
var url = config[env].mailgun.domain.replace('messages', 'unsubscribes');

exports.unsubscribe = function(req, res) {
    var email = req.query.email;
    if (!email) {
        res.redirect('/?unsubscribed=true');
    }
    request({
        method: 'POST'
        , url: url
        , auth: {
            user: 'api'
            , password: key
        }
        , form: {
            address: email
            , tag: '*'
        }
    }, function(err, response){
            console.log('Response:', response.statusCode);
            console.log('Response:', response.body);
            if(200 == response.statusCode) {
                res.redirect('/?unsubscribed=true');
            } else {
                res.redirect('/?unsubscribed=error');
            }
        }
    );
}