var mongoose = require('mongoose')
    , Schema = mongoose.Schema
    ;

// Just keep refs to other models like this.
var bidsSchema = new Schema({
    bidder: String
    , item: String
    , bid: String
    , notified: {
        type: Boolean
        , default: false
    }
    , timestamp: {
        type: Date
        , default: Date.now
    }
});

module.exports = mongoose.model('bids', bidsSchema)
