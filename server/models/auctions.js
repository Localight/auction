var mongoose = require('mongoose')
    , Schema = mongoose.Schema
    ;

var auctionsSchema = new Schema({
    auctionNumber: Number
    , start: Date
    , end: Date
});

module.exports = mongoose.model('auctions', auctionsSchema)
module.exports = mongoose.model('auctions', auctionsSchema)
