var request = require('request');
var config = require('../../config/config')
var env = process.env.NODE_ENV || 'development';
var key = config[env].mailgun.apiKey;
var url = config[env].mailgun.domain.replace('messages', 'unsubscribes');
var Bidder = require('../models/bidders');

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
exports.getBidder = function(req, res) {
    var bidderid = req.params.id;
    Bidder.findOne({
        _id: bidderid
    })
    .exec(function(err, bidder) {
        if(err) {
            console.log('error getting bidder', err);
            return res.json(500, {message: 'Error getting bidder'});
        }
        if(!bidder) {
            return res.json({});
        }
        var item = {
          "_id": bidder._id,
          "email": bidder.email,
          "name": bidder.name,
          "phone": bidder.phone,
          "cards": []
        };
        var cards = bidder.cards;
        for (var i = 0; i < cards.length; i++) {
            item.cards.push(cards[i].lastFour);
        }
        res.json(item);
    });
}
