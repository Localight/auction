var express = require('express');
var app = express();
app.use(express.logger());

app.get('/', function(request, response) {
  response.send('Hello World!');
});

var serverPort = process.env.PORT || 5155;
var serverAddress = '0.0.0.0';
app.listen(serverAddress+':'+serverPort, function() {
  console.log("Listening on " + serverAddress+':'+serverPort);
});