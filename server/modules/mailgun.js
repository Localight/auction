'use strict';
/**
 * Mailgun module, handles sending of messages.
 * @author Zlatko Duric
 */

var Mailgun = require('mailgun').Mailgun;
var math = require('money-math');
var Mailcomposer = require('mailcomposer').MailComposer;
var emailTemplates = require('email-templates');
var pluralize = require('pluralize');
var Bidder = require('../models/bidders');
var Bid = require('../models/bids');

var Q = require('q');
var mg, domain, key, from, etemplate;
var baseLink = 'http://auctions.TeachArt.org/';

/** Mailgun setup
 * To be called on app bootstrap.
 */
var setup = exports.setup = function(config) {
    key = config.apiKey;
    domain = config.domain;
    mg = new Mailgun('key-9dvf0-00loxr-uzq4moazo0gwwc3qsk2');
    from = config.from || 'auction@teachart.org'
    prepareTemplates();
};

/** loads email templates to keep them on hold
 */
function prepareTemplates() {
    emailTemplates('./server/templates', function(err, tpl) {
        etemplate = tpl;
    });
}
/**
 * Actual sending of the message for the auction event
 */
var sendMessage = exports.sendMessage = function sendMessage(to, subject, body, html, attachments) {
    console.log('Sending msg: ', to, subject, typeof body, typeof html, attachments && attachments.length);
    var composer = new Mailcomposer();
    composer.setMessageOption({
        from: from
        , to: to
        , subject: subject
        , body: body || html
        , html: html
    });
    if(attachments) {
        for (var i in attachments) {
            var att = attachments[i];
            composer.addAttachment({
                fileName: att.fileName
                , cid: att.cid || 'autocid-' + i
                , filePath: att.filePath
            });
        }
    }
    var msgdata = '';
    composer.on('error', function(){
        console.log('Composer error: ', arguments);
    });
    composer.on('data', function(data){
        msgdata += data;
    });
    composer.on('end', function(err, messageBody){
        mg.sendRaw('auction@TeachArt.org', to, msgdata, domain, function(err, done){
            console.log('Err or done: ', err || done);
            if(err) console.log(err.message);
        });
    });
    composer.streamMessage();
};

// Sending test email message
setup({
    apiKey: 'key-9dvf0-00loxr-uzq4moazo0gwwc3qsk2'
    , domain: 'https://api.mailgun.net/v2/outgoing.arstempo.hr/messages'
    , from: 'zlatko@arstempo.hr'
});
sendMessage('zladuric@gmail.com', 'Test email on TeacArt', 'plain text body', '<h2>h2 text</h2>')
// helper
function getBidByItemAndBidder(itemNumber, bidderId) {
    var d = Q.defer();
    Bid.findOne({item: itemNumber, bidder: bidderId})
    .exec(function(err, data) {
        console.log('Error getting bid from mailer', err, data);
        if(err) return d.reject(err);
        return d.resolve(data);
    });
    return d.promise;
}
/**
 * Function that does the actual notification.
 * Skip bidders who are not verified.
 *
 **/

exports.notifyLoser = function notify(bidderId, bidderEmail, auctionAmount, auctionEnd, item) {
    console.log('notifying...');
    getBidByItemAndBidder(item.itemNumber, bidderId)
    .then(function(bid){
    Bidder.findOne({_id: bidderId}, function(err, bidder){
        if(err || bidder ===null) {
            return;
        }
        console.log(auctionAmount);
        auctionAmount = parseFloat(auctionAmount)/100;
        if(typeof auctionAmount !== 'string') {
            auctionAmount = '' + auctionAmount;
        };
        if(auctionAmount.indexOf('.') == -1) auctionAmount= auctionAmount + '.00';
        console.log('Auction amount: ', auctionAmount);
        var amount = parseFloat(bid.bid)/100;
        if(typeof amount !== 'string') amount = '' + amount;
        if(amount.indexOf('.') === -1) amount = amount + '.00';
        var winning = math.add('0.00', auctionAmount); // format winning bid.
        var bid1 = math.add(winning, '5.00');
        var bid2 = math.add(winning, '10.00');
        var bid3 = math.add(winning, '20.00');
        var cid = 'image.png';
        var locals = {
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
                , email: bidderEmail
            }
        };
        var howmuch = math.subtract(auctionAmount, amount);
        console.log('Actual: ', auctionAmount, ' this one: ', amount, ' missed by: ', howmuch);
        locals.outbid.howmuch = howmuch;
        etemplate('outbid', locals, function(err, html, text){
            var to = [bidderEmail];
            var subject = 'You have been outbid by $' + howmuch + ' | Artist: ' + item.artist;
            var attachments = [];
            console.log('Image: ', item.image);
            if(item.image.length) {
                item.image = 'app/images/gallery/' + item.image;
                attachments.push({
                    fileName: 'image.png'
                    , cid: cid
                    , filePath: item.image
                });
            }

            sendMessage(to, subject, text, html, attachments);
            bid.notified = true;
            bid.timestamp = new Date();
            bid.save(function(err, sved){
                console.log('saved the outbid notif flag');
                console.log(err, sved);
            });
        });
    });
    })
    .fail(function(err){
      console.log('No bid to notify about', err);
    });
};

/**
 * Notifies about high bid.
 *
 **/
exports.notifyHighBidder = function notify(bidderId, bidderEmail, bidderAmount, auctionEnd, item) {
    console.log('Sending email to high bidder for: ', item);
    Bidder.findOne({_id: bidderId}, function(err, bidder){
        if(err || bidder === null ) {
            console.log('NOT!! sending email');
            return;
        }
        // return to float
        bidderAmount = bidderAmount / 100;
        if(typeof bidderAmount!== 'string') {
            bidderAmount = '' + bidderAmount;
        };

        console.log('Amount: ', bidderAmount);
        if(bidderAmount.indexOf('.') == -1) bidderAmount = bidderAmount + '.00';
        var amount = math.add('0.00', bidderAmount);
        var winning = amount;
        var cid = 'image.png';
        var locals = {
            outbid: {
                amount: amount
                , artist: item.artist
                , itemId: item.itemNumber
                , itemLink: baseLink + 'items?itemNumber=' + item.itemNumber
                , winning: winning
                , itemCid: cid
                , cid: cid
                , endTime: getEndTime(auctionEnd)
                , email: bidderEmail
            }
        };
        etemplate('highbid', locals, function(err, html, text){
        console.log('Template text: ', text.substr(0, 50));
            var to = [bidderEmail];
            var subject = 'You have the high bid: $' + amount + ' | Artist: ' + item.artist;
            var attachments = [];
            console.log('Omage: ', item.image);
            if(item.image.length) {
                item.image = 'app/images/gallery/' + item.image;
                attachments.push({
                    fileName: 'image.png'
                    , cid: cid
                    , filePath: item.image
                });
            }
            sendMessage(to, subject, text, html, attachments);
        });
    });
};
exports.notifyEndAuctionToLosers = function(email){
    etemplate('losers', {email: email}, function(err, html, text){
        var to = [email];
        var subject = 'You did not win at the auction.';
        var attachments = [];
        sendMessage(to, subject, text, html, attachments);
    })
};
exports.notifyWinner = function(email, artist, item, bid) {
    var money = parseFloat(bid)/100;
    if(money.indexOf('.') == -1) money = money + '.00';
    money = math.add('0.00', money);
    var locals = {
        itemId: item.itemNumber
        , email: email
        , artist: artist
        , winning: money
        , itemCid: 'image.png'
        , itemLink: baseLink + 'items?itemNumber=' + item.itemNumber
    }
    etemplate('won', locals, function(err, html, text){
        var to = [bidderEmail];
        var subject = 'You have won the auction | ' + artist;
        var attachments = [];
        console.log('Omage: ', item.image);
        if(item.image.length) {
            item.image = 'app/images/gallery/' + item.image;
            attachments.push({
                fileName: 'image.png'
                , cid: cid
                , filePath: item.image
            });
        }
        sendMessage(to, subject, text, html, attachments);
    });
}
// helper for date calc
function getEndTime(time) {
    var ONE_DAY = 1000 * 60 * 60 * 24;
    var days = Math.round((Math.abs(new Date().getTime() - time.getTime()))/ONE_DAY);
    return days + ' ' + pluralize('day', days) + ', Fri Apr 04 2014 at midnight (PST)'  ;
}
prepareTemplates();
