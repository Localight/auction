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
                console.log('Error getting the item or null:', err, item);
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
    console.log('getting bids.', num);
    if(!num|| num.length === 0) return Q.reject('Please provide the item number for looking up bids');
    var d = Q.defer();
    Bid.find({
        item: '' + num // Item numbers are strings in the db for some reason, have to work around that.
        , notified: false
    })
    .exec(function(err, items) {
        console.log('bids found.', items);
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
        console.log('Am: ', amount);
        console.log(parseFloat(bids[i].bid))
            return false;
        }
    }
    return true;
}
function getHighestBid(bids) {
    var amount = 0;
    var idx;
    console.log('Previous bids: ', bids.length);
    for (var i in bids) {
        console.log(bids[i].bid)
        if(parseFloat(bids[i].bid) > amount) {
            amount = parseFloat(bids[i].bid);
            idx = i;
        }
    }
    console.log('highest bid: ', amount);
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
    console.log('Getbidder middleware');
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
            console.log('Found bidder, attaching to req.', bidder);
            req.bidder = bidder;
            return next();
        }
        console.log('No bidder found, creating one.');
        var bidder = new Bidder({
            email: req.body.email
            , name: req.body.name
            , phone: req.body.phone
        });
        bidder.save(function(err, b){
            if(err){
                console.log('Error saving bidder:', err);
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
         console.log('Item found: ', item);
         findBidsByItemNumber(data.itemNumber)
         .then(function(bids) {
                var bid = new Bid({
                    bidder: '' + req.bidder._id
                    , item: '' + data.itemNumber
                    , bid: data.amount
                    , notified: notified
                });
                bid.save(function(err, bid){
                    // do we need to create a charge?
                    // yes if we're the only bid or we're the highest id.
                    console.log('Saved new bid: ', bid)
                    var highest = getHighestBid(bids);
                    if(!(bids.length == 0 || (highest && highest._id == '' + req.bidder._id))) {
                        //just notify us we have lost. nothing else changes.
                        console.log('just notifying bidder he needs to add more..')
                        notifyLosers([bid], data, item, req);
                        console.log('no prior bids so i am the king.')
                        return res.json({message: 'Bid added'});
                    } else {
                        // try payment first, then notify losers and stuff.
                        createPayment(req.bidder, data, item, bid)
                        .then(function(payment){
                            console.log('Payment made, first notify self.');
                            getAuctionEnd()
                            .then(function(end) {
                                mailer.notifyHighBidder(req.bidder._id, data.email, data.amount, end, item);
                                return res.json({
                                    message: 'Bid placed'
                                });
                            })
                            .fail(function(err){
                               console.log('error getting auc date', err);
                               // just in case. bid is there,email not, we can still let the guy know
                               return res.json(500, {
                                message: 'Error sending bid.'
                               });
                            });
                            console.log('Payment made, second notify losers..');
                            notifyLosers(bids, data, item);
                        })
                        .fail(function(err){
                            console.log('Error with payment', err);
                            return res.json(500, {message: 'Problem.'});
                        });
                    }
                });
                return;
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

// get customer.
// see if we have a matching last four card on file.
//      if no, create
// authorize the card.
function createPayment(bidder, data, item, bid) {
    var d = Q.defer();
    payment.getCustomer(bidder)
    .then(function(customer) {
        console.log('Custeomr:', customer.href);
        console.log('Getting card.');
        payment.getCard(bidder, data, customer)
        .then(function(card){
            console.log('Got card.');
            card.hold({
                amount: data.amount
            })
            .then(
                function(held) {
                    console.log('Amount held. ', held.amount);
                    bid.balanced_href = held.href;
                    bid.save(function(err, saved){
                        console.log('saved bid with held amount href', err, saved);
                        if(err){
                            return d.reject(err);
                        }
                        return d.resolve();
                    })
                }
                , function(failed){
                    console.log('Failed charging.', failed);
                    return d.reject(failed);
                }
            );
        })
        .fail(function(err){
            console.log('Error getting card:', err);
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

function notifyLosers(bids, data, item, req) {
    var bidderIds = [];
    for (var i in bids) {
        if(bids[i].notified == false &&  bids[i].bidder != '' + req.bidder._id) {
            bidderIds.push(bids[i].bidder);
        }
    }
    Bidder.find({_id: {$in: bidderIds}})
    .exec(function(err, bidders) {
        if(err) {
            console.log('Could not fetch bidders.');
            console.log(err);
            return;
        }
        getAuctionEnd()
        .then(function(end) {
            console.log('got auc date', data.email);
            for (var b in bidders){
                console.log('Sending out a notif to ', bidders[b].name);
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

function getAuctionEnd(){
    var d = Q.defer();
    console.log('Auction end called.');
    Auction.find(function(Err, auc){
        if(Err || !auc.length) {
            return d.resolve(new Date('04/04/2014'));
        } else {
            return d.resolve(auc[0].end || new Date('04/04/2014'));
        }
    });
    return d.promise;
}
