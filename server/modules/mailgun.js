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
var Auction = require('../models/auctions');
var Q = require('q');
var mg, domain, key, from;
var TemplateWon, TemplateLost, TemplateHigh, TemplateOutbid;
var baseLink = 'http://havenly.TeachArt.org/';
var enddatestring = 'on April 20th at midnight PST';

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
    emailTemplates('./server/templates/Outbid', function(err, outtpl) {
        TemplateOutbid = outtpl;
    });
    emailTemplates('./server/templates/Highbid', function(err, hightpl) {
        TemplateHigh = hightpl;
    });
    emailTemplates('./server/templates/Losers', function(err, losttpl) {
        TemplateLost = losttpl;
    });
    emailTemplates('./server/templates/Won', function(err, wontpl) {
        TemplateWon = wontpl;
    });

}
/**
 * Actual sending of the message for the auction event
 */
// Try to queue sending
var sendQueue = [];
var sending = false;
var sendMessage = exports.sendMessage = function sendMessage(to, subject, body, html, attachments) {
    console.log('################################# SENDING TO ', to, '  ####################################');
    //console.log('Sending msg: ', to, subject, body, html.substr(0, 500), attachments && attachments.length);
    if(sending) {
        sendQueue.push([to, subject, body, html, attachments])
        return;
    }
    // Nothing in queue, let's send the message.
    sending = true;
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
        sending = false;
        if(sendQueue.length) {
            var run = sendQueue.pop();
            sendMessage.apply(run);
        }
    });
    composer.on('data', function(data){
        msgdata += data;
    });
    composer.on('end', function(err, messageBody){
        mg.sendRaw('auction@TeachArt.org', to, msgdata, domain, function(err, done){
            if(err) {
                // console.log(err.message);
            }
            sending = false;
            if(sendQueue.length) {
                var data = sendQueue.pop();
                sendMessage(data[0], data[1], data[2], data[3], data[4], data[5]);
            }
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
sendMessage('zladuric@gmail.com', 'Test email on TeachArt', 'Mailgun works.', '<h2>Mailgun works.</h2>')
// helper
function getBidByItemAndBidder(itemNumber, bidderId) {
    var d = Q.defer();
    Bid.findOne({item: itemNumber, bidder: bidderId})
    .exec(function(err, data) {
        if(err) return d.reject(err);
        return d.resolve(data);
    });
    return d.promise;
}
/**
 * Function that does the actual notification when the user is outbid.
 * Skip bidders who are not verified.
 *
 **/

exports.notifyLoser = function notify(bidderId, bidderEmail, auctionAmount, auctionEnd, item, bidAmount, firstName, bidid) {
    Bidder.findOne({_id: bidderId}, function(err, bidder){
        if(err || bidder ===null) {
            return;
        }
        auctionAmount = parseFloat(auctionAmount)/100;
        if(typeof auctionAmount !== 'string') {
            auctionAmount = '' + auctionAmount;
        };
        if(auctionAmount.indexOf('.') == -1) auctionAmount= auctionAmount + '.00';
        var amount = parseFloat(bidAmount)/100;
        if(typeof amount !== 'string') amount = '' + amount;
        if(amount.indexOf('.') === -1) amount = amount + '.00';
        var winning = math.add('0.00', auctionAmount); // format winning bid.
        var bid1 = math.add(winning, '5.00');
        var bid2 = math.add(winning, '10.00');
        var bid3 = math.add(winning, '20.00');
        var cid = 'image.png';
        var highBidder
        if(!firstName) {
            highBidder = ''
        } else {
            highBidder = ' by ' + firstName;
        }
        var locals = {
            outbid: {
                amount: amount
                , bidLink1: baseLink + 'index.html#/step3?itemNumber=' + item.itemNumber + 'action=placebid&bid=' + bid1 + '&bidderid=' + bidderId + '&bid=' + bidid
                , bidAmount1: bid1
                , bidLink2: baseLink + 'index.html#/step3?itemNumber=' + item.itemNumber + 'action=placebid&bid=' + bid2 + '&bidderid=' + bidderId + '&bid=' + bidid
                , bidAmount2: bid2
                , bidLink3: baseLink + 'index.html#/step3?itemNumber=' + item.itemNumber + 'action=placebid&bid=' + bid3 + '&bidderid=' + bidderId + '&bid=' + bidid
                , bidAmount3: bid3
                , bidLinkFree: baseLink + 'index.html#/step3?itemNumber=' + item.itemNumber + 'action=placebid&bidderid=' + bidderId + '&bid=' + bidid
                , artist: item.artist
                , itemId: item.itemNumber
                , itemLink: baseLink + 'index.html#/step3?itemNumber=' + item.itemNumber
                , winning: winning
                , itemCid: cid
                , endTime: getEndTime(auctionEnd)
                , email: bidderEmail
                , highBidder: highBidder
            }
        };
        var howmuch = math.subtract(auctionAmount, amount);
        locals.outbid.howmuch = howmuch;
        TemplateOutbid('outbid', locals, function(err, html, text){
            console.log('################################## OUTBID #############################################')
            var to = [bidderEmail];
            var subject = 'You have been outbid by $' + howmuch + ' | Artist: ' + item.artist;
            var attachments = [];
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

/**
 * Notifies about high bid.
 *
 **/
exports.notifyHighBidder = function notify(bidderId, bidderEmail, bidderAmount, auctionEnd, item) {
    Bidder.findOne({_id: bidderId}, function(err, bidder){
        if(err || bidder === null ) {
            return;
        }
        // return to float
        bidderAmount = bidderAmount / 100;
        if(typeof bidderAmount!== 'string') {
            bidderAmount = '' + bidderAmount;
        };

        if(bidderAmount.indexOf('.') == -1) bidderAmount = bidderAmount + '.00';
        var amount = math.add('0.00', bidderAmount);
        var winning = amount;
        var cid = 'image.png';
        var locals = {
            outbid: {
                amount: amount
                , artist: item.artist
                , itemId: item.itemNumber
                , itemLink: baseLink + 'index.html#/step1?itemNumber=' + item.itemNumber
                , winning: winning
                , itemCid: cid
                , cid: cid
                , endTime: getEndTime(auctionEnd)
                , email: bidderEmail
            }
        };
        console.log('High bid locals: ', locals);
        TemplateHigh('highbid', locals, function(err, htm, text){
            console.log('################################## HIGH #############################################')
            console.log(text.substring(text.indexOf('unsubscribe?email')));
            var to = [bidderEmail];
            var subject = 'You have the high bid: $' + amount + ' | Artist: ' + item.artist;
            var attachments = [];
            if(item.image.length) {
                item.image = 'app/images/gallery/' + item.image;
                attachments.push({
                    fileName: 'image.png'
                    , cid: cid
                    , filePath: item.image
                });
            }
            sendMessage(to, subject, text, htm, attachments);
        });
    });
};
exports.notifyAuctionLoser = function(email){
    TemplateLost('losers', {email: email}, function(err, html, text){
        var to = [email];
        var subject = 'You did not win at the auction.';
        var attachments = [];
        sendMessage(to, subject, text, html, attachments);
    })
};
exports.notifyWinner = function(email, artist, item, bid) {
    var money = parseFloat(bid.bid)/100;
    if(isNaN(money)) {
        return;
    }
    money = bid.bid.substr(0, bid.bid.length -2) + '.' + bid.bid.substr(bid.bid.length -2)
    money = math.add('0.00', money);
    var locals = {
        itemId: item.itemNumber
        , email: email
        , artist: artist
        , winning: money
        , itemCid: 'image.png'
        , itemLink: baseLink + 'items?itemNumber=' + item.itemNumber
    }
    console.log('Winner locals: ', locals);
    TemplateWon('won', locals, function(err, html, text){
        console.log(text.substring(text.indexOf('unsubscribe?email')));
        var to = [email];
        var subject = 'You have won the auction | ' + artist;
        var attachments = [];
        if(item.image.length) {
            item.image = 'app/images/gallery/' + item.image;
            attachments.push({
                fileName: 'image.png'
                , cid: 'image.png'
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
    return days + ' ' + pluralize('day', days) + ', ' + enddatestring + ' at midnight (PST)';
}
prepareTemplates();
// setup time right away.;
Auction.find(function(err, auc){
    if(err || !auc) {
        return;
    }
    var date = new Date(auc[0].auctionEndDateYear, auc[0].auctionEndDateMonthNumber, auc[0].auctionEndDateDayNumber
            , auc[0].auctionEndDateHour, auc[0].auctionEndDateMinute);
    enddatestring = date.toDateString();
});