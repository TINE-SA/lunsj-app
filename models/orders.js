
var azure = require('azure-storage');
var uuid = require('node-uuid');
var entityGen = azure.TableUtilities.entityGenerator;

module.exports = Orders;

function Orders(storageClient, tableName, partitionKey) {
    this.storageClient = storageClient;
    this.tableName = tableName;
    this.partitionKey = partitionKey;
};

Orders.prototype = {
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

    placeOrder: function(orderDetails, callback) {
        self = this;
        var newOrder = {
            PartitionKey: entityGen.String(self.partitionKey),
            RowKey: entityGen.String(uuid()),
            customer: entityGen.String(orderDetails.customer),
            orderItem: entityGen.String(orderDetails.orderItem),
            orderPrice: entityGen.String(orderDetails.orderPrice),
            orderDate: entityGen.DateTime(new Date()),
            orderCompleted: entityGen.Boolean(false)
        };
        self.storageClient.insertEntity(self.tableName, newOrder, function entityInserted(error) {
            if(error){
                console.log(error.toString());
                callback(error);
            }
            callback(null);
        });
    },

    editOrder: function(RKey, newOrder, callback) {
        self = this;
        self.storageClient.retrieveEntity(self.tableName, self.partitionKey, RKey, function entityQueried(error, entity, response) {
            if(error) {
                callback(error);
            }
            entity['.metadata'].etag = response['.metadata'].etag;
            entity.orderItem = newOrder.orderItem;
            entity.orderDate = new Date().toLocaleString();
            entity.orderPrice = newOrder.orderPrice;
            self.storageClient.replaceEntity(self.tableName, entity, function entityUpdated(error) {
                if(error) {
                    console.log(error.toString());
                    callback(error);
                }
                callback(null);
            });
        });
    },

    completeOrder: function(RKey, callback) {
        self = this;
        self.storageClient.retrieveEntity(self.tableName, self.partitionKey, RKey, function entityQueried(error, entity, response) {
            if(error) {
                callback(error);
            }
            entity['.metadata'].etag = response['.metadata'].etag;
            entity.orderCompleted = entityGen.Boolean(true);
            self.storageClient.replaceEntity(self.tableName, entity, function entityUpdated(error) {
                if(error) {
                    console.log(error.toString());
                    callback(error);
                }
                callback(null);
            });
        });
    },

    removeOrder: function(RKey, callback) {
        self = this;
        self.storageClient.retrieveEntity(self.tableName, self.partitionKey, RKey, function entityQueried(error, entity) {
            if(error) {
                console.log(error.toString());
                callback(error);
            }
            self.storageClient.deleteEntity(self.tableName, entity, function entityRemoved(error) {
                if(error) {
                    console.log(error.toString());
                    callback(error);
                }
                callback(null);
            });
        });
    }

}
