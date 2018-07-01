const express = require('express');
const mongoose = require('mongoose');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const Mongo = require('mongodb');
const MongoClient = Mongo.MongoClient;
const ObjectId = Mongo.ObjectID;
const fs = require('fs');
const Grid  = require('gridfs');
const app = express();
const port = process.env.PORT || 5000;



let bigDataDb, gridfs, filesArr = [];

app.use(express.static(__dirname + '/public'));
app.use('/bower_components', express.static(__dirname + '/bower_components'));
app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.text());
app.use(bodyParser.json({type: 'application/vnd.api+json'}));
app.use(methodOverride());

let fileListDb = null;

MongoClient.connect("mongodb://localhost:27017", { useNewUrlParser: true },(err, client) => {
  if(err)
    throw err;

  fileListDb = client.db("fileListDb");
    
})


app.listen(port, () => console.log(`Listening on port ${port}`));
