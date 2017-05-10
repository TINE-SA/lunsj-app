
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var fs = require('fs');
var azure = require('azure-storage');
var conf = require('nconf');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname));

conf.env()
    .file({ file: 'azure_config.json', search: true });
var tableName = conf.get("TABLE_NAME");
var menuPartitionKey = conf.get("PARTITION_KEY_MENU");
var orderPartitionKey = conf.get("PARTITION_KEY_ORDER");
var accountName = conf.get("STORAGE_NAME");
var accountKey = conf.get("STORAGE_KEY");

var Menu = require('./models/menu');
var menu = new Menu(azure.createTableService(accountName, accountKey), tableName, menuPartitionKey);
var Orders = require('./models/orders');
var orders = new Orders(azure.createTableService(accountName, accountKey), tableName, orderPartitionKey);

function validReq(req) {
	return req && req.body && req.body.name && req.body.order && req.body.price;
}

function validMenuItemReq(req) {
	return req && req.body && req.body.name && req.body.price;
}

app.get('/tine-lunsj', function (req, res) {
	res.sendFile(__dirname + '/index.html');
});

app.post('/tine-lunsj', function (req, res) {
	if (!validReq(req)) {
		res.sendFile(__dirname + '/failure.html');
	} else {
		var map = {
			customer: req.body.name,
			orderItem: req.body.order,
			orderPrice: req.body.price
		};
		orders.placeOrder(map, function orderPlaced(error) {
				if (error) {
                    res.sendFile(__dirname + '/failure.html');
				} else {
                    io.emit('bestilling', JSON.stringify(map));
				    console.log(new Date().toLocaleString(),', ny bestilling: ', JSON.stringify(map));
                    res.sendFile(__dirname + '/success.html');
				}
			}
		);
	}
});

app.get('/tine-lunsj/menuItem', function (req, res) {
	res.sendFile(__dirname + '/menuItem.html');
});

app.post('/tine-lunsj/menuItem', function (req, res) {
	if (!validMenuItemReq(req)) {
		res.sendFile(__dirname + '/menuItemFailure.html');
	} else {
		var map = {
            name: req.body.name,
			price: req.body.price
		};
		menu.addItem(map, function menuItemAdded(error) {
			 	if (error) {
               	  	res.sendFile(__dirname + '/menuItemFailure.html');
			 	} else {
                    console.log(new Date().toLocaleString(),', ny rett i meny : ', JSON.stringify(map));
			 		res.sendFile(__dirname + '/menuItemSuccess.html');
			 	}
			}
		);
	}
});

app.get('/tine-lunsj/today', function (req, res) {
	res.sendFile(__dirname + '/today.html');
});

app.get('/tine-lunsj/history', function (req, res) {
    res.sendFile(__dirname + '/history.html');
});

app.get('/tine-lunsj/todayPayments', function (req, res) {
	res.sendFile(__dirname + '/todayPayments.html');
});

app.get('/tine-lunsj/menuItems', function (req, res) {
	//TODO: need to change to return actual items with keys etc. before implementing edit/remove functions
	var menuItems = [];
    var query = new azure.TableQuery().where('PartitionKey eq ?', menuPartitionKey);
	menu.findItems(query, function entitiesQueried (error, items) {
		  if (error) {
		  	  console.log(error.toString());
		      res.sendFile(__dirname + '/menuItemFailure.html');
		  } else {
		  		for (var i = 0; i < items.length ; i++) {
		  		    menuItems.push({
		  				name: items[i].name._,
						price: items[i].price._
					});
				}
                res.send(menuItems);
		  }
	});

});

app.get('/tine-lunsj/todayOrders', function (req, res) {
    //TODO: need to change to return actual items with keys etc. before implementing edit/remove functions
	var ordersToday = [];
	var today = new Date();
	today.setHours(0,0,0,0);
	var tomorrow = new Date();
	tomorrow.setHours(24,0,0,0);
	var query = new azure.TableQuery().where('PartitionKey eq ?', orderPartitionKey).and('orderDate >= ? and orderDate < ?', today,tomorrow);
    orders.find(query, function entitiesQueried (error, items) {
		if (error) {
			res.sendFile(__dirname + '/failure.html');
		} else {
			for (var i = 0; i < items.length; i++) {
				ordersToday.push({
                        name: items[i].customer._,
                        order: items[i].orderItem._,
                        price: items[i].orderPrice._,
                        timestamp: items[i].orderDate._
                    }
                );
		  	}
            res.send(ordersToday);
		}
	});
});

app.get('/tine-lunsj/allOrders', function (req, res) {
	var allOrders = [];
    var query = new azure.TableQuery().where('PartitionKey eq ?', orderPartitionKey);
    orders.find(query, function entitiesQueried (error, items) {
        if (error) {
            res.sendFile(__dirname + '/failure.html');
        } else {
            for (var i = 0; i < items.length; i++) {
                allOrders.push({
                        name: items[i].customer._,
                        order: items[i].orderItem._,
                        price: items[i].orderPrice._,
                        timestamp: items[i].orderDate._
                    }
                );
            }
            res.send(allOrders);
        }
    });
});

var server = app.listen((process.env.PORT || 5000), function () {
	console.log('App listening on port 5000!');
});

var io = require('socket.io')(server);

io.on('connection', function(socket){
  console.log('a user connected');
});
