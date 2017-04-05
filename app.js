var express = require('express');
var bodyParser = require('body-parser');
var MongoClient = require('mongodb').MongoClient;
var config = require('./config.json');

var ENV = process.argv.forEach(function (val, index, array) {
    if (val.substring(0,4) == 'ENV=') {
        var mode = val.substring(4, val.length+1);
        console.log("Setting Environment to %s", mode);
    }
});

console.log("██████╗ ███████╗███████╗ ████████╗███████╗ ██████╗████████╗ ██████╗ ██████╗ ");
console.log("██╔══██╗██╔════╝██╔════╝ ╚══██╔══╝██╔════╝██╔════╝╚══██╔══╝██╔═══██╗██╔══██╗");
console.log("██║  ██║█████╗  █████╗█████╗██║   █████╗  ██║        ██║   ██║   ██║██████╔╝");
console.log("██║  ██║██╔══╝  ██╔══╝╚════╝██║   ██╔══╝  ██║        ██║   ██║   ██║██╔══██╗");
console.log("██████╔╝███████╗███████╗    ██║   ███████╗╚██████╗   ██║   ╚██████╔╝██║  ██║");
console.log("╚═════╝ ╚══════╝╚══════╝    ╚═╝   ╚══════╝ ╚═════╝   ╚═╝    ╚═════╝ ╚═╝  ╚═╝");

MongoClient.connect("mongodb://" + config.mongo_host + "/" + config.mongo_db, function(err, db){
  if (!err) {
    console.log("Verified Database is up.");
    db.close();
  } else {
    db.close();
    throw new FatalError("ERROR: " + err.message);
  }
});

var app = express();
app.use(bodyParser.json());

app.get('/', function(req, res) {
  res.send("Help info to go here"); //TODO: Add API help here when a GET request comes to root (use res.sendFile to do this)
});

//TODO: Logging needs to be improved (Added, really.)
app.get('/status', function(req, res) {
    MongoClient.connect("mongodb://" + config.mongo_user + ":" + config.mongo_pass + "@" + config.mongo_host + "/" + config.mongo_db + config.mongo_options, function(err, db){
      if (!err) {
        console.log(new Date() + " - Received status GET request and successfully connected to DB.");
      } else {
        console.log("ERROR: " + err.message);
      }
      var collection = db.collection('status');
      collection.find({'location': 'home'}).toArray(function (err, docs) {
          if (!err) {
            if (ENV = "DEV") {
              console.log("Found the following");
              console.log(JSON.stringify(docs[0]));
            }
            res.setHeader('Content-Type', 'application/json');
            res.send(JSON.stringify(docs[0]));
          } else {
            console.log("ERROR: " + err.message);
            res.send("Error encountered, check logs.");
          }
      });

      db.close();
    });
});

app.post('/status', function(req, res) {
  //TODO: Clean up these log statements and only log them in DEV mode.  For now, make it work.
  console.log(new Date() + " - Received new data from POST /status request.");
  console.log(new Date() + " - Received request headers: \n" + JSON.stringify(req.headers, null, 4));
  console.log(new Date() + " - Received POST content: " + JSON.stringify(req.body, null, 4));
  console.log(new Date() + " - Received updated location: " + req.body.location);
  console.log(new Date() + " - Received updated presence: " + req.body.present);
  console.log(new Date() + " - Received updated RSSI Strength: " + req.body.rssiStrength);
  MongoClient.connect("mongodb://" + config.mongo_user + ":" + config.mongo_pass + "@" + config.mongo_host + "/" + config.mongo_db + config.mongo_options, function(err, db){
    if (!err) {
      console.log(new Date() + " - Successfully connected to DB for POST request.");
    } else {
      console.log("ERROR: " + err.message);
    }
    var collection = db.collection('status');
    collection.updateOne({'location': req.body.location},
        { $set: {
            "present": req.body.present,
            "rssiStrength": req.body.rssiStrength,
            "lastUpdated": new Date()
        }}, function(err, result){
            if((!err) && (result.result.n == 1))  {
                console.log(new Date() + " - Record updated successfully");
                res.status(200);
                res.send("OK");
            }
        });
    db.close();
  });
});

app.listen(2017, function() {
  console.log("Listenening on port 2017.");
});
