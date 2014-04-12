var Item = require('../models/items');
var Bid = require('../models/bids');
exports.get = function(req, res) {
    Item.find({}, 'studentNumber itemNumber image')
    .lean()
    .exec(function(err, items) {
        if(err) {
            console.log('Error getting items: ', err);
            return res.json(500, err);
        }
        if(!items.length) {
            return res.json([]);
        }
        var bidIds = [];
        for (var i in items) {
            bidIds.push(items[i].itemNumber);
        }
        Bid.find({
            item: {
                $in: bidIds
            }
        })
        .sort('item')
        .exec(function(err, bids){
            console.log('items: ', items.length, '\r\nbids: ', bids.length)
            if(err) {
                return res.json(500, {message: 'Error'});
            }
            for(var i in items) {
                var itemBids = bids.filter(function(bid) {
                    return items[i].itemNumber == bid.item;
                });
                if(!itemBids.length) {
                    items[i].lastBid = {};
                    items[i].timestamp = null;
                    continue;
                }
                var bid = itemBids.shift();
                while (bid !== undefined) {
                    if(!items[i].lastBid) {
                        items[i].lastBid = {
                            value: bid.bid
                            , timestamp: bid.timestamp
                        };
                        items[i].timestamp = bid.timestamp;
                        bid = itemBids.shift();
                        continue;
                    }
                    if(parseFloat(items[i].lastBid.value) > parseFloat(bid.bid)) {
                        bid = itemBids.shift();
                        continue;
                    }
                    items[i].timestamp = bid.timestamp;
                    items[i].lastBid = {
                        value: bid.bid
                        , timestamp: bid.timestamp
                    }
                    bid = itemBids.shift();
                }
            };
            return res.json(items);
        });
    });
};

exports.getItemByNumber = function(req, res) {
    item.findOne({number: req.params.number})
    .exec(function(err, item) {
        if(err) {
            console.log('Error getting an item: ', err);
            return res.json(500, err);
        }
        res.json(item);
    });
};



function checkHighestBidder(bids, data) {
    var amount = parseFloat(data.amount);
    for (var i in bids) {
        if(parseFloat(bids[i].bid) >= amount) {
            return false;
        }
    }
    return true;
}
function getHighestBid(bids) {
    var amount = 0;
    var idx;
    for (var i in bids) {
        if(parseFloat(bids[i].bid) > amount) {
            amount = parseFloat(bids[i].bid);
            idx = i;
        }
    }
    if(amount > 0) {
        return bids[idx];
    } else {
        return null;
    }
}