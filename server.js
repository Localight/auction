var express = require('express')
    , path = require('path')
    , app = express()
    , server = require('http').createServer(app)
    , mongoose = require('mongoose')
// local modules
    , mailer = require('./server/modules/mailgun')
    , poller = require('./server/modules/poller')
    ;

// some assembly required
var env = process.env.NODE_ENV || 'development'
    , config = require('./config/config')[env]
    ;
// setup mongo
mongoose.connect(config.db.uri, config.db.opts);

// setup mailer and poller
mailer.setup(config.mailgun)
poller.start();

// Setup the express app
app.set('port', process.env.PORT || 4000);
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.cookieParser('sasaddasd3ectKti7WnD9VhWC624mqNhxlrEyhe8C213asd12312YFq7srsK9Hej8IGynWRTlt0FYVddF8e8cMVttE123jWFuIHQF26Hq1ZyAtqcv6KtlgPfBSSBzXac4tN2uSjlGpIN6IA41xUzxzh26t4Ooje5RZtiJTHMYcFkOQq5TiKMyy7cxelOw1bDLUjgXugSClQAL0s2QGzW2G'));
app.use(express.session({
   secret: 'a22a2ekvhrbj2sdaesasdnyhgfasdnejklda3abw12312312da3zsasdfasda4de34tfgeazfqe2ndklgjrelcm', key: 'connect.sid'}));
app.use(express.static(path.join(__dirname, 'public')));
app.use(app.router);
app.set('views', path.join(__dirname, 'public'));
app.set('view engine', 'jade');
// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/test', function(req, res){
    console.log('Test route');
    res.end('Hello world!');
});

app.get('/', function(req, res) {
    res.sendfile('index.html', {root: './public'});
});
// Phase 1, a few RESTful endpoints
var items = require('./server/controllers/items');
app.get('/api/items', items.get);
app.get('/api/items/:number', items.getItemByNumber);

// Catchall route
app.get('*', function(req, res) {
    res.sendfile('404.html', {root: './public'});
});

server.listen(app.get('port'), function(){
    'use strict';
    console.log('Express server listening on port ' + app.get('port'));
});
