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
  Bidder.findOne({_id: bid.bidder})
  .exec(function(err, bidder){
    if (err) {
      return console.log("no bidder", bid.bidder)
    }
    // mailer.notifyAuctionLoser(bidder.email);
  });
};

var soldItems = function(bid){
	console.log('selling item: ', bid);
  Item.findOne({itemNumber:bid.item})
  .exec(function(err, item){
    if (err){
      return console.log("no item ", bid.item)
    }
    item.status = 'sold';
    console.log(item);
    item.save(function(err, data){
      // now it's saved
      console.log('Saved item: ', err || data);
    });
  });
  Item.find({itemNumber: bid.item}, function(err, items) {
    console.log(items);
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
  // var date = new Date();  // test date

  // fetch auction end date; month needs to be recalibrated by index # for scheduler
  var date = new Date(auc[0].auctionEndDateYear, auc[0].auctionEndDateMonthNumber=4, auc[0].auctionEndDateDayNumber, auc[0].auctionEndDateHour, auc[0].auctionEndDateMinute);

  // creates a job to execute a function at auction end date
  var emailWinners = schedule.scheduleJob(date, function(){
    // console.log("Long Beach");
    Bids.find({notified: false}) 
    .exec(function(err, bids){
      if(err){
        throw new Error("Can't get Bids", err);
      }
      // console.log("running loop");
      for (var i=0; i<bids.length; i++){
        // console.log("for loop", bids[i]);
        notifyWinner(bids[i]);
      }
    });
  });

  // schedules emailLosers function at auction end date
  var emailLosers = schedule.scheduleJob(date, function(){
    // console.log("Long Beach");
    // find all bids that have been notified of their loss
    Bids.find({notified: true}) 
    .exec(function(err, bids){
      // if mongoDB comes back with an error
      if(err){
        throw new Error("Can't get Bids", err);
      }
      // console.log("running loop");
      // loop through array of found bids
      for (var i=0; i<bids.length; i++){
        // console.log("for loop", bids[i]);
        // email each loser
        notifyLoser(bids[i]);
      }
    });
  });

  // schedule new auction with items that have no bids
  var createNewAuction = schedule.scheduleJob(date, function(){

    updater.update(6, 3, function(err) {
      if(err) {
          return console.log("no auction date ", err);
      } else {
          console.log("auction updated");
      }
    });

    // Auction.find()
    // .exec(function(err, auctions){
    //   if (err){
    //     throw new Error("Can't get auctions", err);
    //   }
    //   console.log(auctions[0]);
    //   auctions[0].please = "work";
    //   auctions[0].save(function(err,data){
    //     if(err) return;
    //     console.log(data);
    //   })
    // });

    // set all items with a bid to status of sold
    Bids.find()
    .exec(function(err, bids){
      if (err){
        throw new Error("Can't get Bids", err);
      }
	console.log('Selling items: ', bids.length);
     for (var i=0; i<bids.length; i++){
	console.log('Selling item: ', bids[i].item);
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


