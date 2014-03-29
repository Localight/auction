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

var mg, domain, key, from, etemplate;
var baseLink = 'http://www.TeachArt.org/';

/** Mailgun setup
 * To be called on app bootstrap.
 */
var setup = exports.setup = function(config) {
    key = config.apiKey;
    domain = config.domain;
    mg = new Mailgun('key-9dvf0-00loxr-uzq4moazo0gwwc3qsk2');
    //from = config.from || 'zlatko@arstempo.hr';
    from = 'zlatko@nowhere.com'
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
sendMessage('zladuric@gmail.com', 'test sub', 'plain text', '<h2>h2 text</h2>')

/**
 * Function that does the actual notification.
 * Skip bidders who are not verified.
 *
 **/
exports.notify = function notify(bidderId, bidId, bidderEmail, bidderAmount, auctionAmount, auctionEnd, item) {
    Bidder.findOne({_id: bidderId}, function(err, bidder){
        if(err || bidder === null || !bidder.verified || bidder.verified === false) {
            return;
        }
        var amount = math.subtract(auctionAmount, bidderAmount).replace('-', '');
        var winning = math.add('0.00', auctionAmount); // format winning bid.
        var bid1 = amount;
        var bid2 = math.mul(amount, '2.00');
        var bid3 = math.mul(amount, '3.00');
        var cid = (item.image.length && item.image.lastIndexOf('/') !== -1) ? item.image.substr(item.image.lastIndexOf('/')) : item.png;
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
            }
        };
        etemplate('outbid', locals, function(err, html, text){
            var to = [bidderEmail];
            var subject = 'You have been outbid by' + amount + '| Artist: ' + item.artist;
            var attachments = [];
            if(item.image.length) {
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

// helper for date calc
function getEndTime(time) {
    var ONE_DAY = 1000 * 60 * 60 * 24;
    var days = Math.round((Math.abs(new Date().getTime() - time.getTime()))/ONE_DAY);
    return days + ' ' + pluralize('day', days) + ', ' + time;
}
prepareTemplates();