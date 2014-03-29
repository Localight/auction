'use strict';
/**
 * @module poller
 * It will poll the database on a 5-min interval and queue emails as needed.
 * 1. Fetch all bids with timestamp < 5min
 * 2. For each bid, check if amount < current amount
 * 3. If it is, send notification to the bidder.
 * Spec:
 * Set up bidding trigger. This is the result of a server-script that compares
 * the amounts and timestamps per item every 5 minutes to see if there is a new
 * high bid per item. If there is, an email is triggered to all bidders who are
 * NOT the highest bidder, to tell them to increase their bid. After this is
 * sent the status is updated for the trigger as "sent" per bidder. Then when
 * this email is viewed per bidder the status is updated as "viewed".
 */
var Q = require('q');
var _ = require('lodash');
var mongoose = require('mongoose');
var ObjectId = mongoose.Types.ObjectId
var Bid = require('../models/bids');
var Bidder = require('../models/bidders');
var Auction = require('../models/auctions');
var Item = require('../models/items');
var Student = require('../models/students');

var mailer = require('./mailgun');

var POLLER_TIME = 1000 * 60 * 5; // 5 minutes const

/**
 * returns an array of lst 5 min of bids sorted by its auctionId.
 */
function getNewBids() {
    var d = Q.defer();
    Bid.find({
            timestamp: {
                $gt: Date.now() - POLLER_TIME
            }
            , notified: false
    })
    .sort({
        auctionId: -1
        // , bid: 1  // Can't sort by bid since amount is string.
    })
    .exec(function(err, data){
        if(err || !data.length) {
            return d.resolve([]);
        }
        return d.resolve(data);
    });
    return d.promise;
}
/** Find the given item and it's artist.
 */
function getItemAndArtist(itemId) {
    var d = Q.defer();
    Item.findOne({itemNumber: itemId})
    .exec(function(err, item){
        if(err || item === null) {
            return d.reject(err);
        }
        Student.findOne({
            number: item.studentNumber
        })
        .exec(function(err, student){
            if(err || student === null) {
                return d.reject(err);
            }
            return d.resolve({
                artist: student.firstName + ' ' + student.lastName.substr(0, 1) + '.'
                , itemNumber: item.itemNumber
                , image: item.image
            });
        });
    });
    return d.promise;
}
/**
 * Method that runs a check for a particular auction.
 * First, see if we have the item at all.
 * Then load the auction so we can update it if needed.
 * Sort the bids by the bid amount.
 * Update the auction with the highest and inform the others.
 */
function checkAndQueueAuction(bids) {
    if(!bids.length) {
        return;
    }
    getItemAndArtist(bids[0].item)
    .then(function(item){
        Auction.findOne({
            auctionNumber: bids[0].auctionId
        })
        .exec(function(err, auction){
            if(err){
                // handle error
                return;
            }
            var amount = parseInt(auction.currentAmount.replace('.', ''));
            var max = 0;
            // find the highest bid.
            for (var i = 0; i < bids.length; i++) {
                var curAmount = parseInt(bids[i].bid.replace('.', ''));
                if(amount < curAmount) {
                    max = i;
                    amount = curAmount;
                }
            }
            // we found max, save it
            var maxBid = bids.splice(max, 1);
            auction.currentAmount = maxBid[0].bid;
            auction.save(function(err){
                if(err) {
                    // handle err.
                    return console.log('Error saving the updated auction amount: ', err);
                }
                // now notify the others. Don't duplicate notifications, just notify the biggest one.
                if(!bids.length) {
                    return;
                }
                var sortedBidders = {};
                for (var i in bids) {
                    var currentBid = bids[i];
                    if(sortedBidders[currentBid.bidder] === undefined) {
                        sortedBidders[currentBid.bidder] = [{amount: currentBid.bid, id: currentBid._id}];
                    } else {
                        sortedBidders[currentBid.bidder].push({amount: currentBid.bid, id: currentBid._id});
                    }
                }
                prepareNotifications(sortedBidders, auction.currentAmount, auction.end, item);
            });
        });
    })
    .fail(function(err){
        console.log('No item or artist: ', err);
    });
}
/**
 * Fetch new bids, then group them by auction and pass to the notifier method.
 */
function pollNewBids()  {
    getNewBids()
    .then(function(bids){
        console.log('Starting poll, bid count: ', bids.length)
        if(!bids.length) return;
        var currentAuction = [];
        var currentAuctionId = bids[0].auctionId;
        for (var i in bids) {
            var curr = bids[i];
            // if we match, just go in the same bucket.
            if (curr.auctionId == currentAuctionId) {
                currentAuction.push(curr);
                continue;
            }
            // if not, call the notifier on the current bucket, then start a new one
            checkAndQueueAuction(_.clone(currentAuction));
            currentAuction = [curr];
            currentAuctionId = curr.auctionId;
        }
        // off by one
        checkAndQueueAuction(_.clone(currentAuction));
    })
    .fail(function(err){
        console.log('Poller failed:', err);
    });
}
/**
 * For each bidder, find his max bid and prepare a notification that he has
 * failed by an xx amount.
 */
function prepareNotifications(sortedBidders, amount, auctionEnd, item) {
    var bidderIds = Object.keys(sortedBidders);
    Bidder.find({_id: {
        $in: bidderIds
    }})
    .exec(function(err, data){
        if(err){
            console.log('Error fetching bidders: ', err);
            return;
        }
        for (var i in data) {
            var amounts = sortedBidders[data[i]._id];
            var max = 0;
            var maxString = '0.00';
            var bidId = null;
            var bidsToUpdate = [];
            for (var j in amounts) {
                bidsToUpdate.push(amounts[j].id);
                var a = parseInt(amounts[j].amount);
                if(a > max) {
                    max = a;
                    maxString = amounts[j].amount;
                    bidId = amounts[j].id;
                }
            }
            // we now have this bidder sorted out.
            mailer.notify(data[i]._id, bidId, data[i].email, maxString, amount, auctionEnd, item);
            // update all the notifier things.
            Bid.find({_id: {$in: bidsToUpdate}})
            .exec(function(err, biddata){
                if(err){
                    // handle
                }
                for (var i in biddata) {
                    biddata[i].notified = true;
                    biddata[i].save();
                }
            })
        }
    });
}

exports.start = function(){
    setInterval(pollNewBids, POLLER_TIME);
};