var mongoose = require('mongoose')
    , Schema = mongoose.Schema
    ;

var auctionsSchema = new Schema({
    auctionNumber: Number
    , currentAmount: String
    , start: Date
    , end: Date
});

module.exports = mongoose.model('auctions', auctionsSchema)