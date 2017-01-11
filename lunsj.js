
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var fs = require('fs');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname));

var orders = [];
var menuItems = [];

fs.readFile(__dirname + '/menuItems.txt', 'utf8', function (err, data) {
  if (err) {
    return;
  }
  var lines = data.split('\n');
  for(var i = 0; i < lines.length; i++) {
  	var item = lines[i].split('###');
  	if (item.length == 2) {
		menuItems.push({
			name: item[0],
			price: item[1]
		});
  	}
  }
});

function validReq(req) {
	console.log(req.body);
	return req && req.body && req.body.name && req.body.order && req.body.price;
}

function validMenuItemReq(req) {
	return req && req.body && req.body.name && req.body.price;
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
			price: req.body.price,
			timestamp: new Date()
		};
		orders.push(map);
    io.emit('bestilling', JSON.stringify(map));
		res.sendfile(__dirname + '/success.html');
	}
});

app.get('/tine-lunsj/menuItem', function (req, res) {
	res.sendfile(__dirname + '/menuItem.html');
});

app.post('/tine-lunsj/menuItem', function (req, res) {
	if (!validMenuItemReq(req)) {
		res.sendfile(__dirname + '/menuItemFailure.html');
	} else {
		var map = {
			name: req.body.name,
			price: req.body.price
		};
		menuItems.push(map);
		fs.appendFile(__dirname + '/menuItems.txt', map.name + '###' + map.price + '\n', function (err) {
			if (err) {
				console.log('something bad happen - deal with this later..');
			}
		});
		res.sendfile(__dirname + '/menuItemSuccess.html');
	}
});

app.get('/tine-lunsj/today', function (req, res) {
	res.sendfile(__dirname + '/today.html');
});

app.get('/tine-lunsj/todayPayments', function (req, res) {
	res.sendfile(__dirname + '/todayPayments.html');
});

app.get('/tine-lunsj/menuItems', function (req, res) {
	res.send(menuItems);
});

app.get('/tine-lunsj/todayOrders', function (req, res) {
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

var server = app.listen(5000, function () {
	console.log('Example app listening on port 5000!');
});

var io = require('socket.io')(server);

io.on('connection', function(socket){
  console.log('a user connected');
});
