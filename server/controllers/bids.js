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
                //console.log('Error getting the item or null:', err, item);
            return d.reject(err);
        }
        Student.findOne({number: item.studentNumber})
        .exec(function(err, student) {
            if(err || student === null)
            {
                //console.log('Error:a', err);
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
    //console.log('getting bids by:', num);
    if(!num|| num.length === 0) return Q.reject('Please provide the item number for looking up bids');
    var d = Q.defer();
    Bid.find({
        item: '' + num // Item numbers are strings in the db for some reason, have to work around that.
        , notified: false
    })
    .exec(function(err, items) {
        //console.log('bids found.', items);
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
        //console.log('Am: ', amount);
        //console.log(parseFloat(bids[i].bid))
            return false;
        }
    }
    return true;
}
function getHighestBid(bids) {
    var amount = 0;
    var idx;
    //console.log('Previous bids: ', bids.length);
    for (var i in bids) {
        //console.log('Bid ' , i, ' amount: ', bids[i].bid);
        if(parseFloat(bids[i].bid) > amount) {
            amount = parseFloat(bids[i].bid);
            idx = i;
        }
    }
    //console.log('highest bid: ', amount, ', index: ', idx);
    if(amount > 0) {
        return bids[idx];
    } else {
        return null;
    }
}

/** To pay, we need cc info. To send email, we need these:
  outbid: {
                amount: amount
                , bidLink1: baseLink + '/items?itemNumber=' + item.itemNumber + 'action=placebid&bid=' + bid1 + '&bidderid=' + bidderId
                , bidAmount1: bid1
                , bidLink2: baseLink + '/items?itemNumber=' + item.itemNumber + 'action=placebid&bid=' + bid2 + '&bidderid=' + bidderId
                , bidAmount2: bid2
                , bidLink3: baseLink + '/items?itemNumber=' + item.itemNumber + 'action=placebid&bid=' + bid3 + '&bidderid=' + bidderId
                , bidAmount3: bid3
                , bidLinkFree: baseLink + '/items?itemNumber=' + item.itemNumber + 'action=placebid&bidderid=' + bidderId
                , artist: item.artist
                , itemId: item.itemNumber
                , itemLink: baseLink + 'items?itemNumber=' + item.itemNumber
                , winning: winning
                , itemCid: cid
                , endTime: getEndTime(auctionEnd)
            }
A first bid tries to findOrCreate the bidder by email. Then tries to findOrCreate the BP customer and BP card.
Then it tries to create a CC hold. Then it inserts the bid and notifies the bidder.

A losing bid takes a note of the bid and just enters a bid. It then notifies the person about not winning bid.

A winning bid notifies all the others and sets their bids to notified = true; Whether or not one of the previous bidders is the current bidder, we send him a new highbid email.
But we only send one email to the bidder.

Also, what if the current bid is not the best bid, but we're winning?

*/
exports.getBidder = function(req, res, next) {
    //console.log('Getbidder middleware');
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
            //console.log('Found bidder, attaching to req.', bidder);
            req.bidder = bidder;
            return next();
        }
        //console.log('No bidder found, creating one.');
        var bidder = new Bidder({
            email: req.body.email
            , name: req.body.name
            , phone: req.body.phone
        });
        bidder.save(function(err, b){
            if(err){
                //console.log('Error saving bidder:', err);
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
         //console.log('Item found: ', item);
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
                        //console.log('Error saving bid: ', err);
                        return res.json(500, {
                            message: 'Problem saving bid.'
                        });
                    }
                    // do we need to create a charge?
                    // yes if we're the only bid or we're the highest id.
                    //console.log('Saved new bid: ', bid)
                    var highest = getHighestBid(bids);
                    // if we have a higher bidder (other then us), insert bid without charge.
                    if(highest && parseFloat(highest.bid) >= parseFloat(data.amount) && highest._id !== '' + req.bidder._id) {
                        //just notify us we have lost. nothing else changes.
                        //console.log('just notifying bidder he needs to add more..', bids.length);
                        //console.log('highest', highest);
                        var high = highest.bid;
                        //console.log('Logging high I am outbid by: ', high);
                        notifyLosers([bid], data, item, req, high);
                        return res.json({message: 'Bid placed.'});
                    } else {
                        // if highest bidder and we're it, just skip
                        //console.log('ids: ', highest && highest._id, '' + req.bidder._id)
                        if(highest && parseFloat(highest.bid) >= parseFloat(data.amount) && (('' + highest._id) === ('' + req.bidder._id))) {
                            // but save the info.
                            return res.json({
                                message: 'Bid already submit, no change.'
                            });
                        } else if (highest && parseFloat(highest.bid) < parseFloat(data.amount) && (('' + highest._id) === ('' + req.bidder._id)) ) {
                            // update our own bid.
                            //console.log('update current bid')
                        } else {
                            //console.log('we have the high bid, new bid, ie ')
                        }
                        // in other cases, we're cool.
                        // try payment first, then notify losers and stuff.
                        createPayment(req.bidder, data, item, bid)
                        .then(function(payment){
                            //console.log('Payment made, first notify self.');
                            getAuctionEnd()
                            .then(function(end) {
                                mailer.notifyHighBidder(req.bidder._id, data.email, data.amount, end, item);
                                return res.json({
                                    message: 'Bid placed'
                                });
                            })
                            .fail(function(err){
                               //console.log('Create payment: error getting auc date', err);
                               // just in case. bid is there,email not, we can still let the guy know
                               return res.json(500, {
                                message: 'Error sending bid.'
                               });
                            });
                            //console.log('Payment made, second notify losers..');
                            //console.log('Logging high am oubnt: ', data.amount);
                            // function notifyLosers(bids, data, item, req, high) {
                            notifyLosers(bids, data, item, req, data.amount);
                        })
                        .fail(function(err){
                            //console.log('Error with payment', err);
                            return res.json(500, {message: 'Problem.'});
                        });
                    }
                });
                return;
            })
            .fail(function(err){
              //console.log('error getting bids', err);
              return res.json(500, {message: 'Error getting bids'});
          });
    })
    .fail(function(err){
        //console.log('Error getting item: ', err);
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
        //console.log('Custeomr:', customer.href);
        //console.log('Getting card.');
        payment.getCard(bidder, data, customer)
        .then(function(card){
            //console.log('Got card.');
            card.hold({
                amount: data.amount
            })
            .then(
                function(held) {
                    //console.log('Amount held. ', held.amount);
                    bid.balanced_href = held.href;
                    bid.save(function(err, saved){
                        //console.log('saved bid with held amount href', err, saved);
                        if(err){
                            return d.reject(err);
                        }
                        return d.resolve();
                    })
                }
                , function(failed){
                    //console.log('Failed charging.', failed);
                    return d.reject(failed);
                }
            );
        })
        .fail(function(err){
            //console.log('Error getting card:', err);
            return d.reject(err);
        });
    })
    .fail(function(err){
        //console.log('Error: ', err);
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
    //console.log('Outbid on my bid of ', data.amount, ' by the high bid of ', high)
    var bidderIds = [];
    for (var i in bids) {
        if(bids[i].notified == false) {
            bidderIds.push(bids[i].bidder);
            bids[i].notified = true;
            bids[i].timestamp = new Date();
            bids[i].save(function(err, saved){
                //console.log('Changed notification for bid: ', bids[i]._id, ' by bidder:', bids[i].bidder);
                //console.log(err, saved);
            })
        }
    }
    Bidder.find({_id: {$in: bidderIds}})
    .exec(function(err, bidders) {
        if(err) {
            //console.log('Could not fetch bidders.');
            //console.log(err);
            return;
        }
        getAuctionEnd()
        .then(function(end) {
            //console.log('got auc date to send to ', data.email);
            for (var b in bidders){
                //console.log('Sending out a notif to ', bidders[b].name);
                var bidAmount;
                for (var inner in bids) {
                    if('' + bids[inner].bidder == '' + bidders[b]._id) {
                        //console.log('found my bidder and bid:', bids[inner]);
                        bidAmount = bids[inner].bid;
                    } else {
                        //console.log('not yet my bider');
                    }
                }
                //console.log('Sending notif: ', bidders[b]._id, bidders[b].email,  high, end, item, bidAmount)
                mailer.notifyLoser(bidders[b]._id, bidders[b].email,  high, end, item, bidAmount);
                bids[inner].notified = true;
                bids[inner].timestamp = new Date();
                bids[inner].save(function(err, sved){
                    //console.log('saved the outbid notif flag');
                    //console.log(err, sved);
                });
            }
        })
        .fail(function(err){
            //console.log(' This again is a fail. error getting auc date', err);
            // just in case. bid is there,email not, we can still let the guy know
            return;
        });
    });
}

function getAuctionEnd(){
    var d = Q.defer();
    //console.log('Auction end called.');
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
        console.log('Sending to losers: ', list);
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