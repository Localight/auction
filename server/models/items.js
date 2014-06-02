var mongoose = require('mongoose')
    , Schema = mongoose.Schema
    , ObjectId = mongoose.Schema.ObjectId
    ;

// Just keep refs to other models like this.
var itemsSchema = new Schema({
    studentNumber: String
    , itemNumber: String
    , image: String
    , status: String
    , _id:String 
});

module.exports = mongoose.model('items', itemsSchema)
