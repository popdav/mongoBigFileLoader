const express = require('express');
const mongoose = require('mongoose');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const Mongo = require('mongodb');
const MongoClient = Mongo.MongoClient;
const Server = Mongo.Server
const ObjectId = Mongo.ObjectID;
const fs = require('fs');
var Grid = require('gridfs-stream');
const app = express();
const CSV = require('csv-string');
const port = process.env.PORT || 5000;

let delimiter = ',';

app.use(express.static(__dirname + '/public'));
app.use('/bower_components', express.static(__dirname + '/bower_components'));
app.use(morgan('dev'));
app.use(bodyParser.json());

app.use(bodyParser.json({limit: '100gb', extended: true, parameterLimit:50000000000}));
app.use(bodyParser.urlencoded({limit: '100gb', extended: true, parameterLimit:50000000000}));
app.use(methodOverride());
//

let db1;
MongoClient.connect("mongodb://localhost:27017/", { useNewUrlParser: true },(err, db) => {
  if(err) throw err;
  db1 = db.db("fileList-test");
});

app.post('/bulkadd', (req, res) => {
		
  const filename = req.body.path;
  if(!fs.existsSync(filename)) {
    console.log({fileExists: false});
    res.send({fileExists: false});
    return;
  }

  let bulk = db1.collection(filename).initializeOrderedBulkOp();

  let fd = fs.openSync(filename, 'r');
  let posInFile = 0;
  let readBytes = 0;
  let buffr = new Buffer(128);

  let fieldNames = [];

  for(let i=0; (readBytes = fs.readSync(fd, buffr, 0, buffr.length, posInFile)) > 0; i++) {
    let line = buffr.toString();
    let firstNewLine = line.indexOf("\n");
    line = line.slice(0, firstNewLine);
    posInFile += line.length + 1;

    if(i === 0) {
      delimiter = CSV.detect(line);
      line = line.replace(new RegExp('"', "g"), "");
      fieldNames = line.split(new RegExp(delimiter, "g"));
    } else {
      line = line.split(new RegExp(delimiter, "g"));
      let newBodyF = {};
      for(let j=0; j<fieldNames.length; j++){
        newBodyF[fieldNames[j]] = line[j].replace(new RegExp('"', 'g'), '');
        if(!isNaN(newBodyF[fieldNames[j]]) && newBodyF[fieldNames[j]] != ''){
          newBodyF[fieldNames[j]] = Number(newBodyF[fieldNames[j]]);
        }
      }
      bulk.insert(newBodyF);
    }
  }

    bulk.execute((err, result) => {
      if(err) throw err;
      // console.log(result);
    });
  
  res.send({file_added: true});
      
  });

app.get("/bulkfiles", (req, res) => {
  db1.listCollections().toArray((err, collInfos) => {
    let arrNames = [];
    for(let i=0; i<collInfos.length; i++) {
      arrNames.push(collInfos[i].name);
    }
    res.send(arrNames);
  });
})

app.post("/bulkdelete", (req, res) => {
  let collName = req.body.path;
  db1.collection(collName).drop((err, delOK) => {
    if (err) throw err;
    if (delOK) console.log("Collection deleted");
    res.send({collection_deleted : true});
  });
})

app.post("/bulkfiledata", (req, res) => {
  console.log(req.body);
  let collName = req.body.path;
  let sortBy = req.body.sortBy;
  let i = req.body.activePage-1;
  let options = {
    "limit": 100,
    "skip": i*100,
    "sort": sortBy
  }
  console.log(options);
  if(sortBy !== null){
    db1.collection(collName).ensureIndex({[sortBy] : 1});
  }
  db1.collection(collName).find(req.body.searchQuery, options).toArray((err, docs) => {
    if(err) throw err;
    console.log(docs.length);
    for(let i=0; i<docs.length; i++)
    {
      delete docs[i]['_id'];
    }
    res.send(docs);
  })
})

app.post("/bulknumofrecors", (req, res) => {
  let collName = req.body.path;
  db1.collection(collName).count((err, num) => {
    res.send(num + "");
  })
})

app.post("/fileExist", (req, res) => {
  
    if (fs.existsSync(req.body.path)) {
        res.send("1");
        return;
    } 

    res.send("0");
})

app.post("/fileProps", (req, res) => {
  console.log(req.body);
  fs.open(req.body.path, 'r', (err, fd) => {
    if(err) return console.log(err);

    let buffr = new Buffer(128);

    fs.read(fd, buffr, 0, buffr.length, 0, (err, bytes) => {
      if(err) throw err;
      let line = "";
      if(bytes > 0) {
        line = buffr.slice(0, bytes).toString();
        let firstNewLine = line.indexOf("\n");
        line = line.slice(0, firstNewLine);
        delimiter = CSV.detect(line);
        line = line.replace(new RegExp(delimiter, "g"), " ");
        line = line.replace(new RegExp('"', "g"), "");
      }

      fs.close(fd, (err) => {
        if(err) throw err;
      });
      console.log("Field names: " + line);
      res.send(line);

    })

  })
})

app.listen(port, () => console.log(`Listening on port ${port}`));
