'use strict';
var mongoose = require('mongoose');

var model = require('./server/models/auctions');
var db = {
    uri: 'mongodb://ord-c8-0.objectrocket.com:39020/havenly'
    , opts: {
        user: 'localism'
        , pass: 'H@llF3rr'
    }
};
function init() {
	if(process.argv[2] && process.argv[2] === 'get') {
		console.log('Getting data.');
		console.log('Connecting to db...');
		mongoose.connect(db.uri, db.opts, function(err){
			if(err) {
				return exit(err);
			}
			console.log('Connected, receiving data...');
			getInfo(exit);
		});
	} else if (process.argv[2] && process.argv[2] === 'update') {
		console.log('Updating data.');
		var month = (process.argv[3] || 5);
		var day = (process.argv[4] || 10);
		console.log('Connecting to db...');
		mongoose.connect(db.uri, db.opts, function(){
			console.log('Updating information...');
			updateInfo(month, day, exit);
		});
	} else {
		console.log('Usage:\r\n');
		var executable = process.argv[1].substr(process.argv[1].lastIndexOf('/') + 1);
		console.log(process.argv[0] + ' ' + executable + ' get          - gets auction info');
		console.log(process.argv[0] + ' ' + executable + ' update 5 21  - update auction end date to 5/21/2014');
		exit();
	}
}
function exit(err){
	if(err) {
		console.log('Error:', err);
		process.exit(1);
	} else {
		process.exit();
	}
}
function getInfo(cb) {
	model.find(function(err, data) {
		console.log(err || data);
		if(!data.length) {
			console.log('No data!');
		}
		cb(err);
	});
}
function updateInfo(month, day, cb){
	model.find(function(err, data){
		console.log('Current data: ', err || data);
		if(err || !data.length) {
			return cb('No data');
		}
		data[0].end = new Date(2014, (month - 1), day, 23, 59);
		data[0].auctionEndDateMonthNumber = month;
		data[0].auctionEndDateDayNumber = day;
		data[0].auctionEndDateText = 'Ends ' + data[0].end.toDateString().substr(4,6) + ' at midnight PST';
		data[0].save(function(err, saved){
			console.log(err || saved);
			cb(err);
		})
	})
}
init();