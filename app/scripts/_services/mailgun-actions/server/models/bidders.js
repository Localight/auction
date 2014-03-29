var mongoose = require('mongoose')
    , Schema = mongoose.Schema
    ;

var biddersSchema = new Schema({
    verified: Boolean
    , token: String
    , phone: String
    , email: String
});

module.exports = mongoose.model('bidders', biddersSchema)
