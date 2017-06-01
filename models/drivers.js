
var azure = require('azure-storage');
var uuid = require('node-uuid');
var entityGen = azure.TableUtilities.entityGenerator;

module.exports = Drivers;

function Drivers(storageClient, tableName, partitionKey) {
    this.storageClient = storageClient;
    this.tableName = tableName;
    this.partitionKey = partitionKey;
};

Drivers.prototype = {
    find: function(query, callback) {
        self = this;
        self.storageClient.queryEntities(this.tableName, query, null, function entitiesQueried(error, result) {
            if(error) {
                console.log(error.toString());
                callback(error);
            } else {
                callback(null, result.entries);
            }
        });
    },

    addDriver: function(driver, callback) {
        self = this;
        var newDriver = {
            PartitionKey: entityGen.String(self.partitionKey),
            RowKey: entityGen.String(uuid()),
            driverName: entityGen.String(driver.name),
            date: entityGen.DateTime(new Date()),
            returned: entityGen.Boolean(false)
        };
        var today = new Date();
        today.setHours(0,0,0,0);
        var query = new azure.TableQuery().where('PartitionKey eq ?', driverPartitionKey).and('date >= ?', today);
        self.find(query, function entityQueried(error,result) {
            if(error) {
                console.log(error.toString());
                callback(error);
            } else {
                if (result.entries.length > 0) {callback(error);}
                else {
                    self.storageClient.insertEntity(self.tableName, newDriver, function entityInserted(error) {
                        if(error){
                            console.log(error.toString());
                            callback(error);
                        }
                        callback(null);
                    });
                }
            }
        });
    },

    driverReturned: function(RKey, callback) {
        self = this;
        self.storageClient.retrieveEntity(self.tableName, self.partitionKey, RKey, function entityQueried(error, result, response) {
            if(error) {
                callback(error);
            } else {
                result['.metadata'].etag = response.headers.etag;
                result.returned = entityGen.Boolean(!result.returned._);
                self.storageClient.replaceEntity(self.tableName, result, function entityUpdated(error) {
                    if (error) {
                        console.log(error.toString());
                        callback(error);
                    }
                    callback(null);
                });
            }
        });
    },

    removeDriver: function(RKey, callback) {
        self = this;
        self.storageClient.retrieveEntity(self.tableName, self.partitionKey, RKey, function entityQueried(error, result) {
            if(error) {
                console.log(error.toString());
                callback(error);
            } else {
                self.storageClient.deleteEntity(self.tableName, result, function entityRemoved(error) {
                    if (error) {
                        console.log(error.toString());
                        callback(error);
                    }
                    callback(null);
                });
            }
        });
    },

    hasDriven: function(callback) {
        self = this;
        var today = new Date();
        today.setHours(0,0,0,0);
        var query = new azure.TableQuery().where('PartitionKey eq ?', driverPartitionKey).and('date >= ?', today);
        self.find(query, function entityQueried(error,result) {
            if(error) {
                console.log(error.toString());
                callback(error);
            } else {
                if (result.entries.length > 0) {callback(true);}
                else {callback(false);}
            }
        });
    },

    hasReturned: function(callback) {
        self = this;
        var today = new Date();
        today.setHours(0,0,0,0);
        var query = new azure.TableQuery().where('PartitionKey eq ?', driverPartitionKey).and('date >= ?', today);
        self.find(query, function entityQueried(error,result) {
            if(error) {
                console.log(error.toString());
                callback(error);
            } else {
                if (result.entries.length > 0) {callback(new Boolean(result.entries[0].returned._));}
                else {callback(false);}
            }
        });
    }
};
