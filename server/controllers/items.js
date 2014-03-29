var Item = require('../models/items');
exports.get = function(req, res) {
    Item.find({}, function(err, items) {
        if(err) {
            console.log('Error getting items: ', err);
            return res.json(500, err);
        }
        res.json(items);
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

