var mongoose = require('mongoose')
    , Schema = mongoose.Schema
    ;

// Just keep refs to other models like this.
var itemsSchema = new Schema({
    studentNumber: String
    , itemNumber: String
    , image: String
});

module.exports = mongoose.model('items', itemsSchema)
