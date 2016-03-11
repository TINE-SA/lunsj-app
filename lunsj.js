
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

var orders = [];

function validReq(req) {
	return req && req.body && req.body.name && req.body.order;
}

app.get('/tine-lunsj', function (req, res) {
	res.sendfile(__dirname + '/index.html');
});

app.post('/tine-lunsj', function (req, res) {
	if (!validReq(req)) {
		res.sendfile(__dirname + '/failure.html');
	} else {
		var map = {
			name: req.body.name,
			order: req.body.order,
			size: req.body.size,
			timestamp: new Date()
		};
		orders.push(map);
		res.sendfile(__dirname + '/success.html');
	}
});

app.get('/tine-lunsj/today', function (req, res) {
	var ordersToday = [];
	var today = new Date();
	for (var i = 0; i < orders.length; i++) {
		if (orders[i].timestamp.getDate() == today.getDate()) {
			ordersToday.push(orders[i]);
		}
	}
	res.send(ordersToday);
});

app.get('/tine-lunsj/allOrders', function (req, res) {
	res.send(orders);
});

app.listen(5000, function () {
	console.log('Example app listening on port 5000!');
});


