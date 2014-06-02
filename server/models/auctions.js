var mongoose = require('mongoose')
    , Schema = mongoose.Schema
    ;

var auctionsSchema = new Schema({
    auctionNumber: Number
    , start: Date
    , end: Date
    , auctionEndDateYear: Number
    , auctionEndDateMonthNumber: Number
    , auctionEndDateDayNumber: Number
    , auctionEndDateHour: Number
    , auctionEndDateMinute: Number
    , auctionEndDateText: String
    , please: String
});

module.exports = mongoose.model('auctions', auctionsSchema)

