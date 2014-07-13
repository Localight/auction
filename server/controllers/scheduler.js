var schedule = require('node-schedule');
var Auction = require('../models/auctions');
var mailer = require('../modules/mailgun');
var Bidder = require('../models/bidders');
var Item = require('../models/items');
var Bids = require('../models/bids');
var Student = require('../models/students');
var updater = require('./updater');

// look for all bidders with notify set to true/they lost
// people have bid more than once / sort unique winners and unique losers
// create an array called jobs contiaining all different jobs and call upon the array later

// mongodb gives err if there is an error/database down
// .exec(function(err, item){

var notifyWinner = function(bid){
  Item.findOne({itemNumber:bid.item})
  .exec(function(err, item){
    if (err){
      return console.log("no item ", bid.item)
    }
    Bidder.findOne({_id: bid.bidder})
    .exec(function (err, bidder){
      if (err){
        return console.log("no bidder ", bid.bidder)
      }
      Student.findOne({number: ""+item.studentNumber})
      .exec(function(err, student){
        // email set to alex for testing, should be bidder.email
	// Do not repeat the email again, we did it once.

        // mailer.notifyWinner(bidder.email, student.firstName +" "+ student.lastName.substr(0,1)+".", item, bid);
      })
    });
  });
};

var notifyLoser = function(bid){
  console.log(bid);
  Bidder.findOne({_id: bid.bidder})
  .exec(function(err, bidder){
    console.log(err || bidder);
    if (err) {
      return console.log("no bidder", bid.bidder)
    }
    // mailer.notifyAuctionLoser(bidder.email);
  });
};

var soldItems = function(bid){
	// console.log('selling item: ', bid);
  Item.findOne({itemNumber:bid.item})
  .exec(function(err, item){
    if (err){
      return console.log("no item ", bid.item)
    }
    item.status = 'sold';
    // console.log(item);
    item.save(function(err, data){
      // now it's saved
      // console.log('Saved item: ', err || data);
    });
  });
  Item.find({itemNumber: bid.item}, function(err, items) {
    // console.log(items);
  });
};

var unsoldItems = function(item){
  if (item.status != 'sold'){
    item.status = 'unsold';
    item.save(function(err, data){
      // now it's saved
      if(err)return;
      // console.log(item);
    });
  }
};

/////-------------------------------------////////
// find date from DB
Auction.find(function(Err, auc){
  if(Err || !auc.length) {
  throw new Error("No Auction Date");
  }

  // fetch auction end date; month needs to be recalibrated by index # for scheduler
  // var date = new Date(auc[0].auctionEndDateYear, auc[0].auctionEndDateMonthNumber=4, auc[0].auctionEndDateDayNumber, auc[0].auctionEndDateHour, auc[0].auctionEndDateMinute);

  var date = new Date(2012, 6, 31, 23, 59, 0);
  // var date = new Date();

  // var date = new Date(2014, 05, 2, 17, 00, 0); // test date

  // creates a job to execute a function at auction end date
  var emailWinners = schedule.scheduleJob(date, function(){
    Bids.find({notified: false}) 
    .exec(function(err, bids){
      if(err){
        throw new Error("Can't get Bids", err);
      }
      for (var i=0; i<bids.length; i++){
        notifyWinner(bids[i]);
      }
    });
  });

  // schedules emailLosers function at auction end date
  var emailLosers = schedule.scheduleJob(date, function(){
    // find all bids that have been notified of their loss
    Bids.find({notified: true}) 
    .exec(function(err, bids){
      // if mongoDB comes back with an error
      console.log(err || bids.length + " emails to send loser");
      if(err){
        throw new Error("Can't get Bids", err);
      }
      // loop through array of found bids
      var emailedLosers = [];
      for (var i=0; i<bids.length; i++){
        // email each loser
        emailedLosers.push(bids[i].bidder);
        if (emailedLosers.indexOf(bids[i].bidder) === -1) {
          notifyLoser(bids[i]);
        }
        // TODO add notified status
        // setBidToNotifiedToEmails(bids[i]);
        // bid.status = loserNotified
      }
    });
  });

  // schedule new auction with items that have no bids
  var createNewAuction = schedule.scheduleJob(date, function(){

    updater.update(6, 3, function(err) {
      if(err) {
          return console.log("no auction date ", err);
      } else {
          // console.log("auction updated");
      }
    });

    // set all items with a bid to status of sold
    Bids.find()
    .exec(function(err, bids){
      if (err){
        throw new Error("Can't get Bids", err);
      }
	// console.log('Selling items: ', bids.length);
     for (var i=0; i<bids.length; i++){
	// console.log('Selling item: ', bids[i].item);
        soldItems(bids[i]);
      }
      
    });
    setTimeout(function(){
    Item.find(function(err, data){console.log(data[data.length -1])})
	}, 6000);

    // set all items without a status of sold to a status of unsold
    Item.find()
    .exec(function(err, items){
      if (err){
        return console.log("no item ", err)
      }
      for (var i=0; i<items.length; i++){
        unsoldItems(items[i]);
      }
    });

  });

});


