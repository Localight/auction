var mongoose = require('mongoose')
    , Schema = mongoose.Schema
    ;

// Just keep refs to other models like this.
var schoolsSchema = new Schema({
    name: String
});

module.exports = mongoose.model('schools', schoolsSchema)
