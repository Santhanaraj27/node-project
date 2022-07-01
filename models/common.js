var mongoObject = {
  dbo: "",
  ObjectId: require("mongodb").ObjectID,

  configure: function (dbObject) {
    this.dbo = dbObject;
  },

  insert: function (db, collection, json) {
    let self = this;
    return new Promise(function (resolve, reject) {
      self.dbo.db(db).collection(collection).insertOne(json, function (err, res) {
        if (err) {
          console.log(err);
          reject(err);
        } else {
          console.log("document inserted");
          resolve(res);
        }
      });
    });
  },

  insertMany: function (db, collection, json) {
    let self = this;
    return new Promise(function (resolve, reject) {
      self.dbo.db(db).collection(collection).insertMany(json, function (err, res) {
        if (err) {
          console.log(err);
          reject(err);
        } else {
          console.log("document inserted", res);
          resolve(res);
        }
      });
    });
  },

  getAll: function (db, collection) {
    let self = this;
    return new Promise(function (resolve, reject) {
      self.dbo.db(db).collection(collection).find({}).toArray(function (err, result) {
        if (err) {
          console.log(err);
          reject(err);
        } else {
          console.log("documents found");
          resolve(result);
        }
      });
    });
  },

  getById: function (db, collection, id) {
    let self = this;
    return new Promise(function (resolve, reject) {
      //let queryString = "{}, { projection: { _id: " + id + "} }";
      self.dbo.db(db).collection(collection).findOne(new self.ObjectId(id), function (err, result) {
        if (err) {
          console.log(err);
          reject(err);
        } else {
          console.log("document found");
          resolve(result);
        }
      });
    });
  },

  deleteId: function (collection, id) {
    var self = this;
    console.log("deleteId: ", id);
    return new Promise(function (resolve, reject) {
      var query = { _id: new self.ObjectId(id) };
      self.dbo.collection(collection).deleteOne(query, function (err, result) {
        if (err) {
          console.log(err);
          reject(err);
        } else {
          console.log("document deleted");
          resolve(result);
        }
      });
    });
  },

  deleteMany: function (collection, query) {
    var self = this;
    console.log("deleteId: ", query);
    return new Promise(function (resolve, reject) {
      //var query = { _id: new self.ObjectId(id) };
      self.dbo.collection(collection).deleteMany(query, function (err, result) {
        if (err) {
          console.log(err);
          reject(err);
        } else {
          console.log("documents deleted");
          resolve(result);
        }
      });
    });
  },

  updateById: function (db, collection, id, newJson, pushData = null) {
    var self = this;
    return new Promise(function (resolve, reject) {
      var myquery = { _id: new self.ObjectId(id) };
      var newvalues = { $set: newJson };
      if (pushData) {
        newvalues.$push = pushData
      }
      self.dbo.db(db).collection(collection).updateOne(myquery, newvalues, function (err, res) {
        if (err) {
          console.log(err);
          reject(err);
        } else {
          console.log("document updated");
          resolve(res);
        }
      });
    });
  },

  getByObjectId: function (collection, id, callback) {
    var self = this;
    var query = { object_id: id.toString() };
    self.dbo.collection(collection).find(query).toArray(function (err, result) {
      if (err) {
        console.log(err);
        callback(err, false);
      } else {
        console.log("document found");
        callback(null, result);
      }
    });
  },
  find: function (db, collection, clause, skip = 0, limit = 0) {
    var self = this;
    return new Promise(function (resolve, reject) {
      self.dbo.db(db).collection(collection).find(clause).skip(skip).limit(limit).toArray(function (err, result) {
        if (err) {
          console.log(err);
          reject(false);
        } else {
          resolve(result);
        }
      });
    });
  },
  findWithSort: function (db, collection, clause, skip = 0, limit = 0, sort = {}) {
    var self = this;
    return new Promise(function (resolve, reject) {

      let sortQuery = {}
      sortQuery["createdAt"] = -1;

      self.dbo.db(db).collection(collection).find(clause).sort(sortQuery).skip(skip).limit(limit).toArray(function (err, result) {
        if (err) {
          console.log(err);
          reject(false);
        } else {
          self.dbo.db(db).collection(collection).countDocuments(clause, function (error, numOfDocs) {
            if (error) return reject(error);
            let returnData = {
              list: result,
              pageMeta: {
                total: numOfDocs,
                size: limit,
                totalPages: Math.ceil(numOfDocs / limit),
                page: skip === 0 ? 1 : (skip) / limit + 1

              }
            }
            resolve(returnData);
          });
        }
      });
    });
  },
  findWithOutSort: function (collection, clause) {
    var self = this;
    return new Promise(function (resolve, reject) {
      self.dbo.collection(collection).find(clause).sort({ "createdAt": -1 }).toArray(function (err, result) {
        if (err) {
          console.log(err);
          reject(false);
        } else {
          resolve(result);
        }
      });
    });
  },
  findOne: function (db, collection, clause) {
    var self = this;
    return new Promise(function (resolve, reject) {
      self.dbo.db(db).collection(collection).findOne(clause, function (err, result) {
        if (err) {
          console.log(err);
          reject(false);
        } else {
          resolve(result);
        }
      });
    });
  },
  search: function (collection, clause, skip = 0, limit = 0) {
    var self = this;
    return new Promise(function (resolve, reject) {
      self.dbo.collection(collection).find(clause).skip(skip).limit(limit).toArray(function (err, result) {
        if (err) {
          console.log(err);
          reject(false);
        } else {
          resolve(result);
        }
      });
    });
  },
  updateManyByObject: function (collection, myquery, newJson) {
    var self = this;
    return new Promise(function (resolve, reject) {
      // var myquery = { ohip: id }
      var newvalues = { $set: newJson };
      self.dbo.collection(collection).updateMany(myquery, newvalues, function (err, res) {
        if (err) {
          console.log(err);
          reject(err);
        } else {
          console.log("document updated");
          resolve(res);
        }
      });
    });
  },
  findWithCount: function (db, collection, clause, skip = 0, limit = 0) {
    var self = this;
    console.log("Hi", db)
    return new Promise(function (resolve, reject) {
      self.dbo.db(db).collection(collection).find(clause).skip(skip).limit(limit).toArray(function (err, result) {
        if (err) {
          console.log(err);
          reject(false);
        } else {
          self.dbo.collection(collection).countDocuments(clause, function (error, numOfDocs) {
            if (error) return reject(error);
            let returnData = {
              list: result,
              pageMeta: {
                total: numOfDocs,
                size: limit,
                totalPages: Math.ceil(numOfDocs / limit),
                page: skip === 0 ? 1 : (skip) / limit + 1
              }
            }
            resolve(returnData);
          });
        }
      });
    });
  },
  findWithCountData: function (db, collection, clause) {
    var self = this;
    console.log(clause)
    return new Promise(async function (resolve, reject) {
      try {
        let result = await self.dbo.db(db).collection(collection).countDocuments(clause)
        console.log("Result", result)
        resolve(result);
      } catch (error) {
        console.log('error - ', error)
        reject(error)
      }
    });
  },
  findWithDistinctCountData: function (db, collection, clause, distinct) {
    var self = this;
    console.log({ db, collection, clause, distinct })
    return new Promise(async function (resolve, reject) {
      try {
        let result = await self.dbo.db(db).collection(collection).distinct(distinct, clause)
        console.log("Result", result)
        resolve(result?.length || 0);
      } catch (error) {
        console.log('error - ', error)
        reject(error)
      }
    });
  },
  updateByObject: function (collection, myquery, newJson, pushData = null) {
    var self = this;
    return new Promise(function (resolve, reject) {
      var newvalues = { $set: newJson };
      if (pushData) {
        newvalues.$push = pushData
      }
      console.log('myquery', myquery)
      console.log('newvalues', newvalues)
      self.dbo.collection(collection).updateMany(myquery, newvalues, function (err, res) {
        if (err) {
          console.log(err);
          reject(err);
        } else {
          console.log("document updated");
          resolve(res);
        }
      });
    });
  },
  updateOneByObject: function (collection, myquery, newJson, pushData) {
    var self = this;
    return new Promise(function (resolve, reject) {
      var newvalues = { $set: newJson, ...pushData };
      console.log('myquery', myquery)
      console.log('newvalues', newvalues)
      self.dbo.collection(collection).updateOne(myquery, newvalues, function (err, res) {
        if (err) {
          console.log(err);
          reject(err);
        } else {
          console.log("document updated");
          resolve(res);
        }
      });
    });
  },
  updateOne: function (db, collection, myquery, newJson) {
    var self = this;
    return new Promise(async function (resolve, reject) {
      try {
        var newvalues = { $set: newJson };
        // console.log('myquery', myquery)
        // console.log('newvalues', newvalues)
        let result = await self.dbo.db(db).collection(collection).updateOne(myquery, newvalues, { upset: true });
        console.log(result)
        return result;
      } catch (e) {
        console.log(e)
        return e
      }
      //   function (err, res) {
      //   if (err) {
      //     console.log(err);
      //     reject(err);
      //   } else {
      //     console.log("document updated");
      //     resolve(res);
      //   }
      // });
    });
  }
};

module.exports = mongoObject;
