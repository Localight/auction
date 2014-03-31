var Q = require('q');
var balanced = require('balanced-official');
balanced.configure('ak-test-29DjuJLrK18V47nrp76hYZKAFyGkJenL7');
var bidder = require('../models/bidders');

exports.createAccount = function(data) {
    var d = Q.defer();
    balanced.marketplace.customers.create(data || {}, function(err, customer) {
        if(err) {
            console.log('Error creating customer', err);
            return d.reject(err);
        }
        console.log('Customer: ', customer && customer._href)
        return d.resolve(customer);
    });
    return d.promise;
}
exports.addCardToCustomer = function(card, customer) {
    var d = Q.defer();
    var cc = balanced.marketplace.cards.create(card)
    cc.associate_to_customer(customer)
    .then(function(data) {
        console.log('Associated to custeomer');
        d.resolve(data);
    }, function(err) {
        console.log('Failed adding card to customer@', err);
        d.reject(err);
    });
    return d.promise;
}
exports.holdCharge = function(card, amount) {
    var d = Q.defer();
   /// card ;
    balanced.get(card)
    .then(function(crd)
        {
        console.log('Got card');
        card.hold({amount: amount})
         d.resolve();
     }, function(err) {
         console.log('Error charging', err);
         d.reject(err);
     });
 }
exports.getCustomer = function(href) {
    var d = Q.defer();
    balanced.get(href)
    .then(function(customer) {
        cons




