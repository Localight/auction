var mongoose = require('mongoose')
    , Schema = mongoose.Schema
    , findOrCreate = require('mongoose-findorcreate');
    ;

var biddersSchema = new Schema({
    verified: Boolean
    , name: String
    , token: String
    , phone: String
    , email: String
    , lastFour: String
    , balanced: String
});
biddersSchema.plugin(findOrCreate);
module.exports = mongoose.model('bidders', biddersSchema)
