
var azure = require('azure-storage');
var fs = require('fs');
var uuid = require('node-uuid');
var entityGen = azure.TableUtilities.entityGenerator;

module.exports = Menu;

function Menu(storageClient, tableName, partitionKey) {
    this.storageClient = storageClient;
    this.tableName = tableName;
    this.partitionKey = partitionKey;
    this.initializeTable = initializeTable.bind(this);
    this.tableCreated = tableCreated.bind(this);
    this.storageClient.createTableIfNotExists(this.tableName, this.tableCreated);
}

function tableCreated(error,result) {
    if(error) {
        console.log(error.toString());
        throw error;
    } else if (result.created){
        console.log('Table did not exist, created.');
        this.initializeTable();
    }
}

function initializeTable() {
    var menuBatch = new azure.TableBatch();
    //TODO: move init menuItems file to azure filestorage?
    //TODO: Maybe implement way to trigger reload of the file so you can update the menu by editing the file and reload it into the table?
    this.storageClient.
    fs.readFile('menuItems.csv', 'utf8', function (error, data) {
        if (error) {
            console.log(error.toString());
            throw error;
        }
        var lines = data.split('\n');
        for(var i = 0; i < lines.length; i++) {
            var item = lines[i].split(';');
            if (item.length == 2) {
                var menuItem = {
                    PartitionKey: entityGen.String(this.partitionKey),
                    RowKey: entityGen.String(uuid()),
                    name: entityGen.String(item[0]),
                    price: entityGen.String(item[1])
                };
                menuBatch.insertEntity(menuItem,{echoContent: true});
            }
        }
        this.storageClient.executeBatch(this.tableName, menuBatch, {echoContent: true}, function menuBatchExecuted(error,result,response) {
            if(error){
                console.log(error.toString());
                throw error;
            }
        });
    }.bind(this));
}

Menu.prototype = {
    findItems: function(query, callback) {
        self = this;
        self.storageClient.queryEntities(self.tableName, query, null, function entitiesQueried(error, result) {
            if(error) {
                console.log(error.toString());
                callback(error);
            } else {
                callback(null, result.entries);
            }
        });
    },

    addItem: function(item, callback) {
        //TODO: add functionality to keep menuItems.csv (init file for menu table) up to date
        self = this;
        var itemDescriptor = {
            PartitionKey: entityGen.String(self.partitionKey),
            RowKey: entityGen.String(uuid()),
            name: entityGen.String(item.newname),
            price: entityGen.String(item.newprice)
        };
        self.storageClient.insertEntity(self.tableName, itemDescriptor, function entityInserted(error) {
            if(error){
                console.log(error.toString());
                callback(error);
            }
            callback(null);
        });
    },


    editItem: function(item, callback) {
        //TODO: add functionality to keep menuItems.csv (init file for menu table) up to date
        self = this;
        self.storageClient.retrieveEntity(self.tableName, self.partitionKey, item.key, function entityQueried(error, entity, response) {
            if(error) {
                console.log(error.toString());
                callback(error);
            } else {
                entity['.metadata'].etag = response.headers.etag;
                entity.price = item.newprice;
                entity.name = item.newname;
                self.storageClient.replaceEntity(self.tableName, entity, function entityUpdated(error) {
                    if (error) {
                        console.log(error.toString());
                        callback(error);
                    }
                    callback(null);
                });
            }
        });
    },

    removeItem: function(item, callback) {
        //TODO: add functionality to keep menuItems.csv (init file for menu table) up to date
        self = this;
        self.storageClient.retrieveEntity(self.tableName, self.partitionKey, item.key, function entityQueried(error, entity) {
            if(error) {
                console.log(error.toString());
                callback(error);
            } else {
                self.storageClient.deleteEntity(self.tableName, entity, function entityRemoved(error) {
                    if (error) {
                        console.log(error.toString());
                        callback(error);
                    }
                    callback(null);
                });
            }
        });
    }

};
