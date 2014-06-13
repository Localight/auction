var mongoose = require('mongoose')
    , Schema = mongoose.Schema
    ;

// Just keep refs to other models like this.
var shipmentsSchema = new Schema({
    bidder: String
    , item: String
    , bid: String
    , pickup: String
    , poBox: String
    , street: String
    , city: String
    , zipCode: String
    , state: String
});

module.exports = mongoose.model('shipment', shipmentsSchema)
