var Q = require('q');
var Bid = require('../models/bids');
var Bidder = require('../models/bidders');
var Item = require('../models/items');
var Auction = require('../models/auctions');

var mailer = require('../modules/mailgun');

// var balanced = require('balaced-official');
//balanced.configure('gghjkjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjj');

exports.post = function(req, res) {
    // a bid is posted on an item. Let's first see if it exists and also get
    // the previous bids
    // submited bid has: item #, bid price, payment info, email, phone #
    var fields = ['itemNumber', 'amount', 'mm', 'yy', 'card', 'ccv', 'zip', 'email', 'name', 'phone'];
    var data = {};
    for (var i in fields) {
        if(!req.body[fields[i]] || req.body[fields[i]] == '') {
            return res.json(400, {message: 'Missing parameter: ' +  fields[i]});
        }
        data[fields[i]] = req.body[fields[i]];
    };
    Item.findOne({itemNumber: data.itemNumber})
    .exec(function(err, item) {
         if(err) {
             return res.json(500, {msg: 'Cannot access database'});
         }
         // ok, item is there. Do we have a higher bid?
         console.log('Item found: ', item);
         findBidsByItemNumber(data.itemNumber)
         .then(function(bids) {
              console.log(bids);
              // if no bids, insert and notify
              if(!bids.length) {
                  insertBidAndNotifyBidder(data, item)
                  .then(function(){
                      return res.json({message: 'Bid placed.'});
                  })
                  .fail(function(err){
                      console.log('Failed inserting bid: ', err)
                      return res.json(400, {
                          message: 'Failed inserting bid: ' + err
                      });
                  })
              } else {
                  var winning = checkHighestBidder(bids, data);
                  if(winning) {
                      insertBidAndNotifyBidder(data, item)
                      .then(function(){
                          notifyLosers(bids, data, item);
                          return res.json({message: 'Bid placed.'});
                      })
                      .fail(function(err){
                          console.log('Failed inserting bid: ', err)
                          return res.json(400, {
                              message: 'Failed inserting bid: ' +  err
                          });
                      });
                  } else {
                      return res.json({
                          message: 'Your bid is too low.'
                      });
                  }
              }
          })
          .fail(function(err){
              console.log('error getting bids', err);
              return res.json(500, {message: 'Error getting bids'});
          });
    });        
};
function findBidsByItemNumber(num) {
    if(!num|| num.length === 0) return Q.reject('Please provide number');
    var d = Q.defer();
    Bid.find({
        itemNumber: num
        , notified: false
    })
    .exec(function(err, items) {
        if(err) {
            return d.reject(err);
        }
        return d.resolve(items);
    });
    return d.promise;
}
function insertBidAndNotifyBidder(data, item) {
    var d = Q.defer();
    Bidder.findOne({
        email: data.email
    })
    .exec(function(err, bidder) {
        if(err) {
            return d.reject(err);
        }
        // update bidder
        if(!bidder) {
            bidder = new Bidder({email: data.email});
        }
        bidder.name = data.name;
        bidder.phone = data.phone;
        bidder.save(function(err, saved) {
            if(err) {
                return d.reject(err);
            }
            var bid = new Bid({
                bidder: bidder._id
                , item: item._id
                , bid: data.amount
            });

            bid.save(function(err, saved) {
                if(err) {
                    console.log('Bid save err: ', err);
                    return d.reject(err);
                }
                getAuctionEnd()
                .then(function(end) {

                    mailer.notifyHighBidder(bidder._id, data.email, data.amount,end, item); 
                    return d.resolve(bid);
                })
                .fail(function(err){
                   // just in case. bid is there,email not, we can still let the guy know
                   return d.resolve(bid);
                });
            });
        });
    });
    return d.promise;
}
function getAuctionEnd(){
    var d = Q.defer();
    Auction.find(function(Err, auc){
        if(Err || ! auc) {
            console.log('Returning dummy date');
            return d.resolve(new Date('04/04/2014'));
        } else {
            return auc.end || new Date('04/04/2014');
        }
    });
    return d.promise;
}

