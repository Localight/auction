var mongoose = require('mongoose')
    , Schema = mongoose.Schema
    ;

// Just keep refs to other models like this.
var studentsSchema = new Schema({
    firstName: String
    , lastName: String
    , number: String
    , classNumber: String
});

module.exports = mongoose.model('students', studentsSchema)
