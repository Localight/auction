var schedule = require('node-schedule');
var Auction = require('../models/auctions');
var mailer = require('../modules/mailgun');
var Bidder = require('../models/bidders');
var Item = require('../models/items');
var Bids = require('../models/bids');
var Student = require('../models/students');

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
      console.log(item.studentNumber);
      Student.findOne({number: ""+item.studentNumber})
      .exec(function(err, student){
        // email set to alex for testing, should be bidder.email
        // mailer.notifyWinner("ag.saldivar@gmail.com", student.firstName +" "+ student.lastName.substr(0,1)+".", item, bid);
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
    mailer.notifyAuctionLoser(bidder.email);
  });
};

var resetAuctionItems = function(bid){
  Item.findOne({itemNumber:bid.item})
  .exec(function(err, item){
    if (err){
      return console.log("no item ", bid.item)
    }
    // console.log(item);

    Item.create({
      itemNumber: bid.item
      , status: "sold"
      , studentNumber: item.studentNumber
      , image: item.image
    });
    item.studentNumber = 16098;
    item.remove();
    // Item.update({status:""}, {$set: {status:"sold"}});
    // console.log(item);
  })
};

/////-------------------------------------////////
// find date from DB
Auction.find(function(Err, auc){
  if(Err || !auc.length) {
  throw new Error("No Auction Date");
  }
  var date = new Date();  // test date

  // fetch auction end date; month needs to be recalibrated by index # for scheduler
  var aed = new Date(auc[0].auctionEndDateYear, auc[0].auctionEndDateMonthNumber=4, auc[0].auctionEndDateDayNumber, auc[0].auctionEndDateHour, auc[0].auctionEndDateMinute);

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
    // commented out until deploy with Zlatko
    // reset auction end date to June 3
    // Auction.create(
    //   {auctionEndDateDayNumber: 3, auctionEndDateHour: 23, auctionEndDateMinute: 59, auctionEndDateMonthNumber: 6, auctionEndDateText: "Ends June 3 at midnight PST", auctionEndDateYear: 2014, auctionNumber: 1, end: "2014-06-03T21:59:00.000Z", start: "2014-04-15T19:02:43.237Z"}
    // ); 

    // auc[0].remove(); // commented out until deploy with Zlatko

    // remove all items with a bid
    Bids.find()
    .exec(function(err, bids){
      if (err){
        throw new Error("Can't get Bids", err);
      }
      for (var i=0; i<bids.length; i++){
        resetAuctionItems(bids[i]);
      }
    });
      // find all item numbers associated with bids and use them to remove them from items array
  });

  emailWinners.cancel();
  emailLosers.cancel();
  createNewAuction.cancel();
});




// Auction.find(function(err, result){

// })

// Auction.find({"start": "2014-04-15T19:02:43.237Z"})
// .exec(function(err, result){
  
// })
// always pass err as first argument
// result is second argument