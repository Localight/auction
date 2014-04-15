var Auction = require('../models/auctions');
exports.get = function(req, res) {
        Auction.find(function(err, auc){
            if(err || !auc.length) {
                return res.json({
                    auctionEndDateYear: 2014
                    , auctionEndDateMonthNumber: 4
                    , auctionEndDateDayNumber: 20
                    , auctionEndDateHour: 23
                    , auctionEndDateMinute: 59
                    , auctionEndDateText: 'Ends April 20th at midnight PST'
                });
            }
            return res.json(auc)
        });
};

