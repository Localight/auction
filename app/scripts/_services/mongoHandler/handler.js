var http = require('http');
http.createServer(function (req, res) {
res.writeHead(200, {'Content-Type': 'text/plain'});
res.end('Hello World!\n');
}).listen(9000);
console.log('Server running at http://198.61.178.112:9000/');
