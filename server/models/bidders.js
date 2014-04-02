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
    , balanced: String
    /**
     * BP data
     */
    , customer_href: String
    , cards: [{
        lastFour: String
        , card_href: String
    }]

});
biddersSchema.plugin(findOrCreate);
module.exports = mongoose.model('bidders', biddersSchema)
