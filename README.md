auction
=======

Community auction

# Goals

## Phase I

1) display a gallery
2) allow user to select item
3) user enters bid price, payment info, name, email and mobile number. 
4) Validate credit card and put a "hold" on the amount (not a full transaction)
5) Confirmation screen that their bid has been registered, with social media.
6) An authentication SMS is sent to user's mobile number using Twilio. 
7) Compare bids then send Trigger 1 if someone has already bid higher, or Trigger 2 to confirm they currently have the high bid on the item. 


## Phase II

Further improvements

# Tasks for P1

// 1. Setup node.js on the server.
// 2. Serve static files from node.js
3. Capture entered form data
# ITEM
- data model to point to havenly objectrocket db
- REST controller for items
- angular service for item posting.
- :w
-
4. Validate CC and authorize (capture, no charge) the submited amount, with 3 days expiry.
5. After valid charge, show Confirmation screen
6. Send SMS
7. Trigger to tell users if they hold the high bid or are being outbid.

## Mailer module

# Install

1. Git clone
2. cd app_folder
3. npm install
4. Copy config/config.js.template to config/config.js and setup developer api keys and Mongo URLs

# Start

5. NODE_ENV=production node server

