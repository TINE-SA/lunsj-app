
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

    completeOrder: function(RKey, callback) {
        self = this;
        self.storageClient.retrieveEntity(self.tableName, self.partitionKey, RKey, function entityQueried(error, result, response) {
            if(error) {
                callback(error);
            } else {
                result['.metadata'].etag = response.headers.etag;
                result.orderCompleted = entityGen.Boolean(!result.orderCompleted._);
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

    removeOrder: function(RKey, callback) {
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
    }

}

/* Should be ok, but not used yet, functionality handled by deleting your order and submitting a new one
 editOrder: function(RKey, newOrder, callback) {
 self = this;
 self.storageClient.retrieveEntity(self.tableName, self.partitionKey, RKey, function entityQueried(error, result, response) {
 if(error) {
 callback(error);
 } else {
 result['.metadata'].etag = response.headers.etag;
 result.orderItem = newOrder.orderItem;
 result.orderDate = new Date();
 result.orderPrice = newOrder.orderPrice;
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
 */