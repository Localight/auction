var Q = require('q');
var Bid = require('../models/bids');
var Bidder = require('../models/bidders');
var Item = require('../models/items');
var Auction = require('../models/auctions');
var Student = require('../models/students');
var payment = require('../modules/payment');
var mailer = require('../modules/mailgun');

function getItem(cr) {
    var d = Q.defer();
    Item.findOne(cr)
    .exec(function(err, item){
        if(err || item === null) {
            return d.reject(err);
        }
        Student.findOne({number: item.studentNumber})
        .exec(function(err, student) {
            if(err || student === null)
            {
                return d.reject(err)
            }
            item.artist = student.firstName + ' ' + student.lastName.substr(0, 1) + '.';
            var result = {
                _id: item._id
                , artist: student.firstName + ' ' + student.lastName.substr(0, 1) + '.'
                , itemNumber: item.itemNumber
                , image: item.image
                , studentNumber: item.studentNumber
            }
            d.resolve(result);
        });
    });
    return d.promise;
}
/**
 * Find all bids on the given item. Bids with 'notified' property set to true have been outbid already.
 **/
function findBidsByItemNumber(num) {
    if(!num|| num.length === 0) return Q.reject('Please provide the item number for looking up bids');
    var d = Q.defer();
    Bid.find({
        item: '' + num // Item numbers are strings in the db for some reason, have to work around that.
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

function checkHighestBidder(bids, data) {
    var amount = parseFloat(data.amount);
    for (var i in bids) {
        if(parseFloat(bids[i].bid) >= amount) {
            return false;
        }
    }
    return true;
}
function getHighestBid(bids) {
    var amount = 0;
    var idx;
    for (var i in bids) {
        if(parseFloat(bids[i].bid) > amount) {
            amount = parseFloat(bids[i].bid);
            idx = i;
        }
    }
    if(amount > 0) {
        return bids[idx];
    } else {
        return null;
    }
}

/** To pay, we need cc info. To send email, we need these:
A first bid tries to findOrCreate the bidder by email. Then tries to findOrCreate the BP customer and BP card.
Then it tries to create a CC hold. Then it inserts the bid and notifies the bidder.

A losing bid takes a note of the bid and just enters a bid. It then notifies the person about not winning bid.

A winning bid notifies all the others and sets their bids to notified = true; Whether or not one of the previous bidders is the current bidder, we send him a new highbid email.
But we only send one email to the bidder.

Also, what if the current bid is not the best bid, but we're winning?

*/
exports.getBidder = function(req, res, next) {
    // middleware that finds current bidder, if there is one, or creates a new one. Attached to req.
    var email = req.body.email;
    Bidder.findOne({
        email: email
    })
    .exec(function(err, bidder){
        if (err) {
            // ignore.
            next();
        }
        if(bidder !== null) {
            req.bidder = bidder;
            return next();
        }
        var bidder = new Bidder({
            email: req.body.email
            , name: req.body.name
            , phone: req.body.phone
        });
        bidder.save(function(err, b){
            if(err){
                next(err);
            }
            req.bidder = b;
            next();
        });
    });
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
    data.amount = data.amount * 100;
    var notified = false;
    getItem({itemNumber: data.itemNumber})
    .then(function(item) {
        // ok, item is there. Do we have a higher bid?
         findBidsByItemNumber(data.itemNumber)
         .then(function(bids) {
                var bid = new Bid({
                    bidder: '' + req.bidder._id
                    , item: '' + data.itemNumber
                    , bid: data.amount
                    , notified: notified
                });
                bid.save(function(err, bid){
                    if(err) {
                        return res.json(500, {
                            message: 'Problem saving bid.'
                        });
                    }
                    // do we need to create a charge and do we need to notify?
                    // if this bid is previousHighest then the past ones, create a charge.
                    // notify us if we're not the previousHighest bid now and somebody else is
                    // notify us if we have made the new previousHighest bid
                    // notify others if we have outbid them.

                    var previousHighest = getHighestBid(bids);
                    var isMyBid = previousHighest.bidder === '' + req.bidder._id;
                    var isHighestBid = parseFloat(previousHighest.bid) < parseFloat(data.amount);
                    console.log('Is my prev bid previousHighest: ', isMyBid)
                    // if there is a higher bidder (other then us), insert bid without charge, email that we're not the previousHighest.
                    if(!isHighestBid && !isMyBid) {
                        //just notify us we have lost. nothing else changes.
                        var high = previousHighest.bid;
                        notifyLosers([bid], data, item, req, high);
                        return res.json({message: 'Bid placed.'});
                    } else {
                        console.log('first else');
                        var notifyLosers = true;
                        // if previousHighest bidder and we're it, just skip email but save the info.
                        if(isMyBid && !isHighestBid) {
                            console.log('higher bid exists, were it.')
                            return res.json({
                                message: 'Bid already submit, no change.'
                            });
                        } else if(isMyBid && isHighestBid) {
                            // new bid, outbidding myself. Just make a payment actually and notify of high bid.
                            notifyLosers = false;
                        }
                        // in other cases, we're cool. We need to create a charge and notify (and de-hold) the user.
                        // try payment first, then notify losers and stuff.
                        createPayment(req.bidder, data, item, bid)
                        .then(function(payment){
                            getAuctionEnd()
                            .then(function(end) {
                                mailer.notifyHighBidder(req.bidder._id, data.email, data.amount, end, item);
                                return res.json({
                                    message: 'Bid placed'
                                });
                            })
                            .fail(function(err){
                               // just in case. bid is there,email not, we can still let the guy know
                               return res.json(500, {
                                message: 'Error sending bid.'
                               });
                            });
                            // We notify losers here, because otherwise the payment might have failed.
                            // when the payment is ok, and we didn't outbid ourselves, tell the others.
                            if(notifyLosers) {
                                notifyLosers(bids, data, item, req, data.amount);
                            }
                            // also cancel previous highest card hold.
                        })
                        .fail(function(err){
                            return res.json(500, {message: 'Problem.'});
                        });
                    }
                });
                return;
            })
            .fail(function(err){
              return res.json(500, {message: 'Error getting bids'});
          });
    })
    .fail(function(err){
        res.json(500, {message: err});
    });
};

// get customer.
// see if we have a matching last four card on file.
//      if no, create
// authorize the card.
function createPayment(bidder, data, item, bid) {
    var d = Q.defer();
    payment.getCustomer(bidder)
    .then(function(customer) {
        payment.getCard(bidder, data, customer)
        .then(function(card){
            card.hold({
                amount: data.amount
            })
            .then(
                function(held) {
                    bid.balanced_href = held.href;
                    bid.save(function(err, saved){
                        if(err){
                            return d.reject(err);
                        }
                        return d.resolve();
                    })
                }
                , function(failed){
                    return d.reject(failed);
                }
            );
        })
        .fail(function(err){
            return d.reject(err);
        });
    })
    .fail(function(err){
        console.log('Error: ', err);
    });
    return d.promise;
}

exports.students = function students(req, res){
    Student.find({})
    .exec(function(err, data){
        res.json(data);
    });
}

function notifyLosers(bids, data, item, req, high) {
    console.log('Outbid on my bid of ', data.amount, ' by the high bid of ', high)
    var bidderIds = [];
    for (var i in bids) {
        if(bids[i].notified == false) {
            bidderIds.push(bids[i].bidder);
            bids[i].notified = true;
            bids[i].timestamp = new Date();
            bids[i].save(function(err, saved){
            })
        }
    }
    Bidder.find({_id: {$in: bidderIds}})
    .exec(function(err, bidders) {
        if(err) {
            return;
        }
        getAuctionEnd()
        .then(function(end) {
            for (var b in bidders){
                var bidAmount;
                for (var inner in bids) {
                    if('' + bids[inner].bidder == '' + bidders[b]._id) {
                        bidAmount = bids[inner].bid;
                    }
                }
                console.log('Sending notif: ', bidders[b]._id, bidders[b].email,  high, end, item, bidAmount)
                mailer.notifyLoser(bidders[b]._id, bidders[b].email,  high, end, item, bidAmount);
                bids[inner].notified = true;
                bids[inner].timestamp = new Date();
                bids[inner].save(function(err, sved){});
            }
        })
        .fail(function(err){
            // just in case. bid is there,email not, we can still let the guy know
            return;
        });
    });
}

function getAuctionEnd(){
    var d = Q.defer();
    Auction.find(function(Err, auc){
        if(Err || !auc.length) {
            return d.resolve(new Date('04/04/2014'));
        } else {
            return d.resolve(auc[0].end || new Date('04/04/2014'));
        }
    });
    return d.promise;
}

exports.notifyAllLosers = function(req, res){
    Bid.find({
        notified: true
    })
    .distinct('bidder', function(err, list){
        if(err){
            return res.json(500, {
                message: 'Error getting list.'
            });
        }
        Bidder.find({
            _id: {
                $in: list
            }
        })
        .exec(function(err, bidders){
            if(err) return;
            for(var i in bidders) {
                mailer.notifyAuctionLoser(bidders[i].email);
            }
        });
        res.json({message: 'Delivery started.'});
    });
}
exports.notifyAllWinners = function(req, res) {
    Bid.find({
        notified: false
    })
    .exec(function(err, list){
        if(err){
            return res.json(500, {
                message: 'Error getting list.'
            });
        }
        for (var i in list) {
            sendAuctionEndNotification(list[i]);
        }
        res.json({message: 'Delivery started.'});
    });
}
function sendAuctionEndNotification(bid) {
    Bidder.findOne({
        _id: bid.bidder
    })
    .exec(function(err, bidder){
        if(err || bidder == null) return;
        Item.findOne({
            itemNumber: bid.item
        })
        .exec(function(err, item){
            if(err || !item) {
                return;
            }
            Student.findOne({
                number: item.studentNumber
            })
            .exec(function(err, student){
                var artist = student.firstName + ' ' + student.lastName.substr(0,1) + '.';
                mailer.notifyWinner(bidder.email, artist, item, bid);
            });
        })
        Student.findOne()
    })
}