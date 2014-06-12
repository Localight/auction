var Q = require('q');
var balanced = require('balanced-official');
var config = require('../../config/config');
balanced.configure(config.balancedpayments);
var createAccount = exports.createAccount = function(bidder) {
    var d = Q.defer();
    var data = {
        name: bidder.name
        , mobile: bidder.mobile
        , email: bidder.email
    };
    balanced.marketplace.customers.create(data || {}).then(function(response) {
        bidder.customer_href = response.href;
        bidder.save(function(err, bidder){
            if(err) {
                console.log('Error here.', err);
                return d.reject(err)
            }
            return d.resolve(response);
        });
    }
    , function(err){
        if(err) {
            console.log('Error creating customer', err);
            return d.reject(err);
        }
    });
    return d.promise;
};
exports.getCard = function(bidder, data, customer){
    var d = Q.defer();
    var str = '' + data.card;
    var lastFour = str.substr(str.length - 4, 4);
    if(bidder.cards && bidder.cards.length) {
        for (var i in bidder.cards) {
            if(bidder.cards[i].lastFour == lastFour) {
                d.resolve(balanced.get(bidder.cards[i].card_href));
                return d.promise;
            }
        }
    }
    // we got this far, so the card is not on file.
    var year = (('' + data.yy).length == 2) ? '20' + data.yy : data.yy;
    balanced.marketplace.cards.create({
        number: '' + data.card
        , expiration_year: year
        , expiration_month: '' + data.mm
        , cvv: '' + data.ccv
    })
    .associate_to_customer(customer)
    .then(function(card){
        if(!bidder.cards) bidder.cards = [];
        bidder.cards.push({card_href: card.href, lastFour: lastFour})
        bidder.save(function(err, bidder){
            if(err) {
                return d.reject(err);
            }
            d.resolve(card);
        })
    }
    , function fail(err){
        console.log('Failed getting associgin card: ', err);
        d.reject(err);
    })
    return d.promise;
}
exports.addCardToCustomer = function(card, customer) {
    var d = Q.defer();
    var cc = balanced.marketplace.cards.create(card);
    cc.associate_to_customer(customer)
    .then(function(data) {
        d.resolve(data);
    }, function(err) {
        d.reject(err);
    });
    return d.promise;
};
exports.holdCharge = function(card, amount) {
    var d = Q.defer();
   /// card ;
    balanced.get(card)
    .then(function(crd){
        card.hold({amount: amount})
         d.resolve();
     }, function(err) {
         console.log('Error charging', err);
         d.reject(err);
     });
 };
 exports.makePayment = function(card, amount){
    var d = Q.defer();
   /// card ;
    balanced.get(card)
    .then(function(crd){
        card.charge({amount: amount})
         d.resolve();
     }, function(err) {
         console.log('Error charging', err);
         d.reject(err);
     }); 
 };

 exports.getCustomer = function(bidder) {
    var d = Q.defer();
    if (!bidder.customer_href) {
        return createAccount(bidder);
    }
    balanced.get(bidder.customer_href)
    .then(function(customer) {
        d.resolve(customer);
    }, function(err){
        console.log('error gettin customer', err);
        d.reject(err);
    });
    return d.promise;
};

exports.removePreviousHold = function(hold) {
    balanced.get(hold)
    .then(function(charge){
        charge.void()
        .then(function(done){
            // console.log('Voided hold', done);
        }
        , function er(er){
            console.log('Error voiding hold', er);
        });
    }
    , function fail(er){
        console.log('Failed getting hold.');
    });
}