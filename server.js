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
const buffSize = 1024;
let dbOff;
MongoClient.connect("mongodb://localhost:27017/", { useNewUrlParser: true },(err, db) => {
  if(err) throw err;
  dbOff = db.db("fileListOffset")
});

//post poziv za dodavanje niz offseta u mongo i njihovo indeksiranje 
app.post('/addoff', (req,res) => {
  const filepath = req.body.path;
  //provera da li fajl vec postoji
  if(!fs.existsSync(filepath)) {
    console.log({fileExists: false});
    res.send({fileExists: false});
    return;
  }
  // inicijalizacija bulka
  let bulk = dbOff.collection(filepath).initializeOrderedBulkOp();
  let fd = fs.openSync(filepath, 'r');
  let posInFile = 0;
  let readBytes = 0;
  let buffr = new Buffer(buffSize);

  //citanje fajla liniju po liniju
  for(let i=0; (readBytes = fs.readSync(fd, buffr, 0, buffr.length, posInFile)) > 0; i++) {
    //parsiranje linije
    let line = buffr.toString();
    let firstNewLine = line.indexOf("\n");
    line = line.slice(0, firstNewLine);
    //pomeranje u fajlu
    
    //ukoliko je i == 0 samo detektuj delimiter i ne radi nista (prvi red je field names)
    if(i == 0) {      
      delimiter = CSV.detect(line);
    } else {
      //dodaj u bulk
      // console.log(line)  
      bulk.insert({_id: i-1, pos: posInFile}); 
    }
    posInFile += line.length + 1;
  }
  //izvrsi bulk
  bulk.execute((err, result) => {
    if(err) throw err;
    // console.log(result);
  })

  res.send({file_added: true});
})

//poziv za slanje podataka
app.post('/filedataoffset', (req, res) => {
  /*
  let newFileBody = {
        path: nextProps.data.data.path,
        activePage: this.state.active100,
        sortBy: this.state.sortBy,
        searchQuery: null
      }
  */ 
  const fileName = req.body.path;
  const wh = req.body.activePage - 1;

  let options = {
    "limit": 100,//limitrano na 100 podataka
    "skip": wh*100//kojih 100 uzimamo
  }
  
  console.log(options)

  dbOff.collection(fileName).find({}, options).toArray((err, docs) => {
    if(err) throw err;

    //uzimanje podataka iz fajla
    let fd = fs.openSync(fileName, 'r');
    let posInFile = 0;
    let readBytes = 0;
    let buffr = new Buffer(buffSize);

    //uzimanje polja iz fajla
    let fieldNames = [];
    readBytes = fs.readSync(fd, buffr, 0, buffr.length, 0);
    let lineF = buffr.toString();
    let firstNewLineF = lineF.indexOf("\n");
    lineF = lineF.slice(0, firstNewLineF);
    delimiter = CSV.detect(lineF);//provera za delimiter
    lineF = lineF.replace(new RegExp('"', "g"), "");
    fieldNames = lineF.split(new RegExp(delimiter, "g")); 
    console.log(fieldNames);
    //

    //prolazak kroz fajl i pravljenje niza
    let bodyArr = [];
    for(let i=0; i < docs.length; i++) {
      //citanje linija po linija
      readBytes = fs.readSync(fd, buffr, 0, buffr.length, docs[i].pos);
      let line = buffr.toString();
      let firstNewLine = line.indexOf("\n");
      line = line.slice(0, firstNewLine);
      
      line = line.split(new RegExp(delimiter, "g"));
      //parsiranje u JSON objekat
      let newBodyF = {};
      for(let j=0; j<fieldNames.length; j++){
        newBodyF[fieldNames[j]] = line[j].replace(new RegExp('"', 'g'), ''); // zamena navodnika sa praznim stringom
        if(!isNaN(newBodyF[fieldNames[j]]) && newBodyF[fieldNames[j]] != ''){ //provera da li je broj
          newBodyF[fieldNames[j]] = Number(newBodyF[fieldNames[j]]);
        }
      }
      bodyArr.push(newBodyF);
      
    }
    res.send(bodyArr);
  })

})

app.post('/sort', (req, res) => {
  const sortBy = 'first_name';
  const fileName = '/home/david/Downloads/test1.csv	';
})

// app.post('/bulkadd', (req, res) => {
		
//   const filename = req.body.path;
//   if(!fs.existsSync(filename)) {
//     console.log({fileExists: false});
//     res.send({fileExists: false});
//     return;
//   }

//   let bulk = db1.collection(filename).initializeOrderedBulkOp();

//   let fd = fs.openSync(filename, 'r');
//   let posInFile = 0;
//   let readBytes = 0;
//   let buffr = new Buffer(128);

//   let fieldNames = [];

//   for(let i=0; (readBytes = fs.readSync(fd, buffr, 0, buffr.length, posInFile)) > 0; i++) {
//     let line = buffr.toString();
//     let firstNewLine = line.indexOf("\n");
//     line = line.slice(0, firstNewLine);
//     posInFile += line.length + 1;

//     if(i === 0) {
//       delimiter = CSV.detect(line);
//       line = line.replace(new RegExp('"', "g"), "");
//       fieldNames = line.split(new RegExp(delimiter, "g"));
//     } else {
//       line = line.split(new RegExp(delimiter, "g"));
//       let newBodyF = {};
//       for(let j=0; j<fieldNames.length; j++){
//         newBodyF[fieldNames[j]] = line[j].replace(new RegExp('"', 'g'), '');
//         if(!isNaN(newBodyF[fieldNames[j]]) && newBodyF[fieldNames[j]] != ''){
//           newBodyF[fieldNames[j]] = Number(newBodyF[fieldNames[j]]);
//         }
//       }
//       bulk.insert(newBodyF);
//     }
//   }

//     bulk.execute((err, result) => {
//       if(err) throw err;
//       // console.log(result);
//     });
  
//   res.send({file_added: true});
      
// });

app.get("/files", (req, res) => {
  dbOff.listCollections().toArray((err, collInfos) => {
    let arrNames = [];
    for(let i=0; i<collInfos.length; i++) {
      arrNames.push(collInfos[i].name);
    }
    res.send(arrNames);
  });
})

app.post("/delete", (req, res) => {
  let collName = req.body.path;
  dbOff.collection(collName).drop((err, delOK) => {
    if (err) throw err;
    if (delOK) console.log("Collection deleted");
    res.send({collection_deleted : true});
  });
})

// app.post("/bulkfiledata", (req, res) => {
//   console.log(req.body);
//   let collName = req.body.path;
//   let sortBy = req.body.sortBy;
//   let i = req.body.activePage-1;
//   let options = {
//     "limit": 100,
//     "skip": i*100,
//     "sort": sortBy
//   }
//   console.log(options);
//   if(sortBy !== null){
//     db1.collection(collName).ensureIndex({[sortBy] : 1});
//   }
//   db1.collection(collName).find(req.body.searchQuery, options).toArray((err, docs) => {
//     if(err) throw err;
//     console.log(docs.length);
//     for(let i=0; i<docs.length; i++)
//     {
//       delete docs[i]['_id'];
//     }
//     res.send(docs);
//   })
// })

app.post("/numofrecors", (req, res) => {
  let collName = req.body.path;
  dbOff.collection(collName).count((err, num) => {
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