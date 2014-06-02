var Auction = require('../models/auctions');

function update(month, day, cb){
        // console.log(Auction.db)
        Auction.find(function(err, data){
                console.log('Current data: ', err || data);
                if(err || !data.length) {
                        return cb('No data');
                }
                data[0].end = new Date(2014, (month - 1), day, 23, 59);
                data[0].auctionEndDateMonthNumber = month;
                data[0].auctionEndDateDayNumber = day;
                data[0].auctionEndDateText = 'Ends ' + data[0].end.toDateString().substr(4,6) + ' at midnight PST';
                data[0].save(function(err, saved){
                        console.log(saved);
                        Auction.find(function(err, data){
                                if (err) console.log("this is error ", err);
                                console.log(data)});
                        console.log(err);
                        cb(err);
                })
        })
}

exports.update = update;