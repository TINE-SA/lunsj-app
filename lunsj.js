
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var multer = require('multer');
var upload = multer();
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

function validOrderReq(req) {
	return req && req.body && req.body.name && req.body.order && req.body.price;
}

function validCompleteOrDeleteOrderReq(req) {
    return req && req.body && req.body.key;
}

function validMenuItemReq(req) {
	return req && req.body && req.body.newname && req.body.newprice;
}

function validUpdateOrDeleteMenuItemReq(req) {
    return validMenuItemReq(req) && req.body.key;
}

app.get('/tine-lunsj', function (req, res) {
	res.sendFile(__dirname + '/index.html');
});

app.post('/tine-lunsj', function (req, res) {
	if (!validOrderReq(req)) {
		console.log('OrderRequest invalid!');
	    res.sendFile(__dirname + '/failure.html');
	} else {
		var map = {
			customer: req.body.name,
			orderItem: req.body.order,
			orderPrice: req.body.price
		};
		orders.placeOrder(map, function orderPlaced(error) {
				if (error) {
                    console.log('PlaceOrder failed!');
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

app.get('/tine-lunsj/today', function (req, res) {
    res.sendFile(__dirname + '/today.html');
});

app.get('/tine-lunsj/history', function (req, res) {
    res.sendFile(__dirname + '/history.html');
});

app.get('/tine-lunsj/todayPayments', function (req, res) {
    res.sendFile(__dirname + '/todayPayments.html');
});

app.get('/tine-lunsj/menuItem', function (req, res) {
	res.sendFile(__dirname + '/menuItem.html');
});

app.post('/tine-lunsj/menuItem', upload.array(), function (req, res) {
	if (!validMenuItemReq(req)) {
		console.log('AddMenuItemRequest invalid!')
	    res.sendStatus(500);
	} else {
		var map = {
            oldname: req.body.oldname,
            key: req.body.key,
            newname: req.body.newname,
            newprice: req.body.newprice
		};
		menu.addItem(map, function menuItemAdded(error) {
            if (error) {
                console.log('addItem failed: ', error.toString());
                res.sendStatus(500);
            } else {
                console.log(new Date().toLocaleString(),', ny rett i meny : ', JSON.stringify(map));
                res.sendStatus(200);
            }
        });
	}
});

app.put('/tine-lunsj/menuItem', upload.array(), function (req, res) {
    if (!validUpdateOrDeleteMenuItemReq(req)) {
        console.log('UpdateMenuItemRequest invalid!');
        res.sendStatus(500);
    } else {
        var map = {
            oldname: req.body.oldname,
            key: req.body.key,
            newname: req.body.newname,
            newprice: req.body.newprice
        };
        menu.editItem(map, function menuItemUpdated (error) {
            if (error) {
                console.log('editItem failed: ', error.toString());
                res.sendStatus(500);
            } else {
                console.log(new Date().toLocaleString(),', endret rett i meny : ', JSON.stringify(map));
                res.sendStatus(200);
            }
        });
    }
});

app.delete('/tine-lunsj/menuItem', upload.array(), function (req, res) {
    if (!validUpdateOrDeleteMenuItemReq(req)) {
        console.log('DeleteMenuItemRequest invalid!');
        res.sendStatus(500);
    } else {
        var map = {
            oldname: req.body.oldname,
            key: req.body.key,
            newname: req.body.newname,
            newprice: req.body.newprice
        };
        menu.removeItem(map, function menuItemDeleted (error) {
            if (error) {
                console.log('removeItem failed: ', error.toString());
                res.sendStatus(500);
            } else {
                console.log(new Date().toLocaleString(),', slettet rett i meny : ', JSON.stringify(map));
                res.sendStatus(200);
            }
        });
    }
});

app.get('/tine-lunsj/menuItems', function (req, res) {
	var menuItems = [];
    var query = new azure.TableQuery().where('PartitionKey eq ?', menuPartitionKey);
	menu.findItems(query, function entitiesQueried (error, items) {
		  if (error) {
		      res.sendFile(__dirname + '/menuItemFailure.html');
		  } else {
		  		for (var i = 0; i < items.length ; i++) {
		  			menuItems.push({
		  				name: items[i].name._,
						price: items[i].price._,
						key: items[i].RowKey._
					});
				}
                res.send(menuItems);
		  }
	});

});

app.get('/tine-lunsj/todayOrders', function (req, res) {
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
                        timestamp: items[i].orderDate._,
						key: items[i].RowKey._,
                        completed: items[i].orderCompleted._
                    }
                );
		  	}
            res.send(ordersToday);
		}
	});
});

app.put('/tine-lunsj/todayOrders', upload.array(), function (req, res) {
    if (!validCompleteOrDeleteOrderReq(req)) {
        console.log('CompleteOrderRequest invalid!');
        res.sendStatus(500);
    } else {
        orders.completeOrder(req.body.key, function orderCompleted (error) {
    		if (error) {
                console.log('completeOrder failed: ', error.toString());
                res.sendStatus(500);
			} else {
                console.log(new Date().toLocaleString(),', satt ordre betalt : ', req.body.key);
                res.sendStatus(200);
			}
		});
	}
});

app.delete('/tine-lunsj/todayOrders', upload.array(), function (req, res) {
    if (!validCompleteOrDeleteOrderReq(req)) {
        console.log('DeleteOrderRequest invalid!');
        res.sendStatus(500);
    } else {
        orders.removeOrder(req.body.key, function orderDeleted (error) {
            if (error) {
                console.log('removeOrder failed: ', error.toString());
                res.sendStatus(500);
            } else {
                console.log(new Date().toLocaleString(),', slettet ordre : ', req.body.key);
                res.sendStatus(200);
            }
        });
    }
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
                        timestamp: items[i].orderDate._,
                        completed: items[i].orderCompleted._
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
