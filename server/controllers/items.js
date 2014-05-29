var Item = require('../models/items');
var Bid = require('../models/bids');
var Student = require('../models/students');
exports.get = function(req, res) {
    var status = req.query.status;
    var condition = {};
    if (status){
        condition.status = status;
    }
    Item.find(condition, 'studentNumber itemNumber image')
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
        var studentIds = [];
        for (var i in items) {
            bidIds.push(items[i].itemNumber);
            studentIds.push(items[i].studentNumber);
        }
        Student.find({
            number: {
                $in: studentIds
            }
        })
        .sort('number')
        .exec(function(err, students) {
            if(err) {
                return res.json(500, {
                    message: 'Error'
                });
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
                    items[i].studentID = items[i].studentNumber;
                    var itemBids = bids.filter(function(bid) {
                        return items[i].itemNumber == bid.item;
                    });
                    var student = students.filter(function(st){
                        return st.number == '' + items[i].studentNumber
                    })
                    if(student.length) {
                        items[i].studentName = student[0].lastName + ', ' + student[0].firstName;
                    }
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
                                , timestamp: bid.timestamp.getTime()
                            };
                            items[i].timestamp = bid.timestamp.getTime();
                            bid = itemBids.shift();
                            continue;
                        }
                        if(parseFloat(items[i].lastBid.value) > parseFloat(bid.bid)) {
                            bid = itemBids.shift();
                            continue;
                        }
                        items[i].timestamp = bid.timestamp.getTime();
                        items[i].lastBid = {
                            value: bid.bid
                            , timestamp: bid.timestamp.getTime()
                        }
                        bid = itemBids.shift();
                    }
                };
                return res.json(items);
            });
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