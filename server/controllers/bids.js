var Q = require('q');
var Bid = require('../models/bids');
var Bidder = require('../models/bidders');
var Item = require('../models/items');
var Auction = require('../models/auctions');
var Student = require('../models/students');
var payment = require('../modules/payment');
var mailer = require('../modules/mailgun');

// var balanced = require('balaced-official');
//balanced.configure('gghjkjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjj');

function getItem(cr) {
    var d = Q.defer();
    Item.findOne(cr)
    .exec(function(err, item){
        if(err || item === null) {
                console.log('Error:ai', err);
            return d.reject(err);
        }
        Student.findOne({number: item.studentNumber})
        .exec(function(err, student) {
            if(err || student === null)
            {
                console.log('Error:a', err);
                return d.reject(err)
            }
            item.artist = student.firstName + ' ' + student.lastName.substr(0, 1) + '.';
            d.resolve(item);
        });
    });
    return d.promise;
}

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
    getItem({itemNumber: data.itemNumber})
    .then(function(item) {
        console.log('Item: ', item);
        // ok, item is there. Do we have a higher bid?
         console.log('Item found: ', item);
         findBidsByItemNumber(data.itemNumber)
         .then(function(bids) {
              console.log(bids);
              // if no bids, insert and notify
              console.log('Checking for highest bid');
              var winning = checkHighestBidder(bids, data);
              console.log('Winning: ', winning);
              if(!bids.length || winning) {
                  console.log('No other bids');
                  insertBidAndNotifyBidder(data, item)
                  .then(function(){
                      console.log('Bid placed');
                      return res.json({message: 'Bid placed.'});
                  })
                  .fail(function(err){
                      console.log('Failed inserting bid: ', err)
                      return res.json(400, {
                          message: 'Failed inserting bid: ' + err
                      });
                  })
              }
              // now also notify the losers
              if(winning) {
                  notifyLosers(bids, data, item);
              } else {
              // but if we posted a bid but did not win, inform ourselves
                  var highest = getHighestBidder(bids);
                  insertLosingBid(highest, data, item);
              }
          })
          .fail(function(err){
              console.log('error getting bids', err);
              return res.json(500, {message: 'Error getting bids'});
          });
    })
    .fail(function(err){
        console.log('Error getting item: ', err);
        res.json(500, {message: err});
    });        
};
function findBidsByItemNumber(num) {
    if(!num|| num.length === 0) return Q.reject('Please provide number');
    var d = Q.defer();
    Bid.find({
        item: '' + num
        , notified: false
    })
    .exec(function(err, items) {
        console.log('Bid results: ', err, items);
        if(err) {
            return d.reject(err);
        }
        return d.resolve(items);
    });
    return d.promise;
}
function insertLosingBid (highest, data, item) {
    console.log(highest);
    var d = Q.defer();
    Bidder.findOne({
        email: data.email
    })
    .exec(function(err, bidder) {
        if(err) {
            return d.reject();
        }
        if(!bidder) {
            bidder = new Bidder({email: data.email});
        }
        bidder.name = data.name;
        bidder.phone = data.phone;
        bidder.save(function(err, saved) {
            if(err) {return d.reject();}
            var bid = new Bid({
                bidder: bidder._id
                , item: data.itemNumber
                , bid: data.amount
                , notified: false
            });

            bid.save(function(err, saved) {
            console.log('saving bid');
                if(err) {
                    return d.reject(err);
                }
                getAuctionEnd()
                .then(function(end) {
                    mailer.notifyLoser(bidder._id, bidder.email,  highest.bid ,end, item);
                    return d.resolve(bid);
                })
                .fail(function(err){
                   console.log('error getting auc date', err);
                   // just in case. bid is there,email not, we can still let the guy know
                   return d.resolve(bid);
                });
            });
        });
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
            console.log('saved bidder: ', err, saved);
            if(err) {
                return d.reject(err);
            }
            var bid = new Bid({
                bidder: bidder._id
                , item: data.itemNumber
                , bid: data.amount
                , notified: false
            });

            bid.save(function(err, saved) {
            console.log('saving bid');
                if(err) {
                    console.log('Bid save err: ', err);
                    return d.reject(err);
                }
                getAuctionEnd()
                .then(function(end) {
                   console.log('got auc date', data.email);

                    mailer.notifyHighBidder(bidder._id, data.email, data.amount,end, item); 
                    return d.resolve(bid);
                })
                .fail(function(err){
                   console.log('error getting auc date');
                   // just in case. bid is there,email not, we can still let the guy know
                   return d.resolve(bid);
                });
            });
        });
    });
    return d.promise;
}
function createPayment(data, bidder, bid) {
    var d = Q.defer();
    payment.getCustomer(bidder)
    .then(function(customer) {
        console.log('Custeomr:', customer);
    })
    .fail(function(err){
        console.log('Error: ', err);
    });
}

function getAuctionEnd(){
    var d = Q.defer();
    Auction.find(function(Err, auc){
        if(Err || !auc.length) {
            console.log('Returning dummy date');
            return d.resolve(new Date('04/04/2014'));
        } else {
        console.log('returning date');
        console.log(Err, auc);
            return auc[0].end || new Date('04/04/2014');
        }
    });
    return d.promise;
}
exports.students = function students(req, res){
    Student.find({})
    .exec(function(err, data){
        res.json(data);
    });
}
function checkHighestBidder(bids, data) {
    console.log('checking if ', data , ' is the higest among ', bids.length ,  ' bids', bids[0]);
    var amount = parseFloat(data.amount);
    for (var i in bids) {
        if(parseFloat(bids[i].bid) >= amount) {
        console.log('Am: ', amount);
        console.log(parseFloat(bids[i].bid))
            return false;
        }
    }
    return true;
}
function getHighestBidder(bids) {
    var amount = 0;
    var idx;
    for (var i in bids) {
        if(parseFloat(bids[i].bid) > amount) {
            amount = parseFloat(bids[i]);
            idx = i;
        }
    }
    console.log('highest bid: ', idx);
    return bids[idx];
}
function notifyLosers(bids, data, item) {
    console.log('Notifying losers: ', bids.length, '\r\nWinning: ', data, '\r\nItem: ', item);
    var bidderIds = [];
    for (var i in bids) {
        bidderIds.push(bids[i].bidder);
    }
    Bidder.find({_id: {$in: bidderIds}})
    .exec(function(err, bidders) {
        if(err) {
            console.log('Could not fetch bidders.');
            console.log(err);
            return;
        }
        console.log('Notifying bidders of a new high bid');
        getAuctionEnd()
        .then(function(end) {
            console.log('got auc date', data.email);
            for (var b in bidders){
            // (bidderId, bidId, bidderEmail, bidderAmount, auctionAmount, auctionEnd, item) {
                mailer.notifyLoser(bidders[b]._id, bidders[b].email,  data.amount,end, item); 
            }
        })
        .fail(function(err){
            console.log('error getting auc date', err);
            // just in case. bid is there,email not, we can still let the guy know
            return;
        });
    });
}

