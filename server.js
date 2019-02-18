const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const Mongo = require('mongodb');
const MongoClient = Mongo.MongoClient;
const fs = require('fs');
const app = express();
const CSV = require('csv-string');
const Promise = require('promise');
const port = process.env.PORT || 5000;

let delimiter = ',';

app.use(express.static(__dirname + '/public'));
app.use('/bower_components', express.static(__dirname + '/bower_components'));
app.use(morgan('dev'));
app.use(bodyParser.json());

app.use(bodyParser.json({limit: '100gb', extended: true, parameterLimit:50000000000}));
app.use(bodyParser.urlencoded({limit: '100gb', extended: true, parameterLimit:50000000000}));
app.use(methodOverride());

const server = app.listen(port, () => console.log(`Listening on port ${port}`));
const io = require('socket.io')(server);
//
const buffSize = 1024;
let dbOff, dbOff2;
MongoClient.connect("mongodb://localhost:27017/", { useNewUrlParser: true },(err, db) => {
  if(err) throw err;
  dbOff = db.db("fileListOffset");
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
      bulk.insert({_id: i-1, pos: posInFile}); 
    }
    posInFile += line.length + 1;
  }
  //izvrsi bulk
  bulk.execute((err, result) => {
    if(err) throw err;
  })

  res.send({file_added: true});
})

//poziv za slanje podataka
app.post('/filedataoffset', (req, res) => {
  
  const fileName = req.body.path;
  let wh = req.body.activePage - 1;
  if(wh < 0) wh = 0;
  // console.log(req.body.searchQuery)
  let options = {
    "limit": 100,//limitrano na 100 podataka
    "skip": wh*100,//kojih 100 uzimamo
    "sort" : req.body.sortBy
  }
  console.log(options);
  let searchQueryKeys;
  if(req.body.searchQuery !== null)
    searchQueryKeys = Object.keys(req.body.searchQuery);  

  if(req.body.sortBy !== null){
    dbOff.collection(fileName).ensureIndex({[req.body.sortBy] : 1});
  }

  let bodyArr = [];
  let sendPromise = new Promise((resolve, reject) => {
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
      
      for(let i=0; i < docs.length; i++) {
        //citanje linija po linija
        readBytes = fs.readSync(fd, buffr, 0, buffr.length, docs[i].pos);
        let line = buffr.toString();
        let firstNewLine = line.indexOf("\n");
        line = line.slice(0, firstNewLine);
        line = line.split(new RegExp(delimiter, "g"));
        // console.log(docs[i]);
        //parsiranje u JSON objekat
        let newBodyF = {};
        for(let j=0; j<fieldNames.length; j++){
          newBodyF[fieldNames[j]] = line[j].replace(new RegExp('"', 'g'), ''); // zamena navodnika sa praznim stringom
          if(!isNaN(newBodyF[fieldNames[j]]) && newBodyF[fieldNames[j]] != ''){ //provera da li je broj
            newBodyF[fieldNames[j]] = Number(newBodyF[fieldNames[j]]);
          }
        }
        if(req.body.searchQuery !== null && newBodyF[searchQueryKeys[0]].includes(req.body.searchQuery[searchQueryKeys[0]]))
          bodyArr.push(newBodyF);
        else if(req.body.searchQuery === null)
          bodyArr.push(newBodyF);
        
      }
      resolve();
      // res.send(bodyArr);
    })
  })

  sendPromise.then(() => {
    res.send(bodyArr);
  })
  

})

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

app.post("/testupdate", (req, res) => {
  dbOff.collection('/home/david/Downloads/MOCK_DATA.csv').updateOne({pos : 48}, {$set:{nesto: 'nesto'}}, (err, resu) => {
    if(err) throw err;
    console.log(resu);
    res.send({update: true});
  })
})


app.post("/numofrecors", (req, res) => {
  let collName = req.body.path;
  dbOff.collection(collName).countDocuments((err, num) => {
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



//socket

io.on('connection', (client) => {
  console.log('Socket: Table.js connected');
  client.on('addsort', (body)=>{
    const sortBy = body.sortBy;
    const fileName = body.path;
    console.log(body);
    
    dbOff.collection(fileName).find({}, (err, docs) => {
      if(err) throw err;

      let fd = fs.openSync(fileName, 'r');
      let readBytes = 0;
      let buffr = new Buffer(buffSize);

      let fieldNames = [];
      readBytes = fs.readSync(fd, buffr, 0, buffr.length, 0);
      let lineF = buffr.toString();
      let firstNewLineF = lineF.indexOf("\n");
      lineF = lineF.slice(0, firstNewLineF);
      delimiter = CSV.detect(lineF);//provera za delimiter
      lineF = lineF.replace(new RegExp('"', "g"), "");
      fieldNames = lineF.split(new RegExp(delimiter, "g"));
      let promiseArr = [];
      let docProm = new Promise((resolve, reject) => {
        docs.each((err, doc) => {
          if(err) throw err;
  
          if(doc !== null) {
            if(sortBy in doc){
              console.log("Sortirano je vec po:")
              console.log(sortBy)
              client.emit('startsort', body);
              return false;
            }

            readBytes = fs.readSync(fd, buffr, 0, buffr.length, doc.pos);
            let line = buffr.toString();
            let firstNewLine = line.indexOf("\n");
            line = line.slice(0, firstNewLine);
            line = line.split(new RegExp(delimiter, "g"));
    
            //parsiranje u JSON objekat
            let newBodyF = {pos : doc.pos};
            for(let j=0; j<fieldNames.length; j++){
              newBodyF[fieldNames[j]] = line[j].replace(new RegExp('"', 'g'), ''); // zamena navodnika sa praznim stringom
              if(!isNaN(newBodyF[fieldNames[j]]) && newBodyF[fieldNames[j]] != ''){ //provera da li je broj
                newBodyF[fieldNames[j]] = Number(newBodyF[fieldNames[j]]);
              }
            }
            let newValObj = {};
            newValObj[sortBy] = newBodyF[sortBy];
            const newVal = { $set: newValObj };
            
            promiseArr.push(new Promise((resolve1, reject1) => {
              dbOff.collection(fileName).updateOne({pos : newBodyF.pos}, newVal, (err, resu) => {
                if(err) throw err;
                resolve1();
              })
            })
            ) 
          } else {
            Promise.all(promiseArr).then(() => {
              resolve();
            })
            
          }
        
        })
      })
      docProm.then(() => {
        client.emit('startsort', body);
      })
      

    })
  });
  //
  // client.on('searchquery', (body)=>{
  //   let searchArr = [];
  //   if(body !== null) {
  //     console.log(body);
  //     const searchQuery = body.searchQuery;
  //     const fileName = body.path;
  //     //
  //     dbOff.collection(fileName).find({}, (err, docs) => {
  //       if(err) throw err;
  
  //       let fd = fs.openSync(fileName, 'r');
  //       let readBytes = 0;
  //       let buffr = new Buffer(buffSize);
  
  //       let fieldNames = [];
  //       readBytes = fs.readSync(fd, buffr, 0, buffr.length, 0);
  //       let lineF = buffr.toString();
  //       let firstNewLineF = lineF.indexOf("\n");
  //       lineF = lineF.slice(0, firstNewLineF);
  //       delimiter = CSV.detect(lineF);//provera za delimiter
  //       lineF = lineF.replace(new RegExp('"', "g"), "");
  //       fieldNames = lineF.split(new RegExp(delimiter, "g"));
        
          
  //        let docRes = new Promise((resolve, reject) => {
  //         docs.each((err, doc) => {
  //           if(err) throw err;
            
  //           if(doc != null){
  //             readBytes = fs.readSync(fd, buffr, 0, buffr.length, doc.pos);
  //             let line = buffr.toString();
  //             let firstNewLine = line.indexOf("\n");
  //             line = line.slice(0, firstNewLine);
  //             line = line.split(new RegExp(delimiter, "g"));
      
  //             //parsiranje u JSON objekat
  //             let newBodyF = {pos : doc.pos};
  //             for(let j=0; j<fieldNames.length; j++){
  //               newBodyF[fieldNames[j]] = line[j].replace(new RegExp('"', 'g'), ''); // zamena navodnika sa praznim stringom
  //               if(!isNaN(newBodyF[fieldNames[j]]) && newBodyF[fieldNames[j]] != ''){ //provera da li je broj
  //                 newBodyF[fieldNames[j]] = Number(newBodyF[fieldNames[j]]);
  //               }
  //             }
  //             let searchKeys = Object.keys(searchQuery);
  //             if(newBodyF[searchKeys[0]] != null && newBodyF[searchKeys[0]].includes(searchQuery[searchKeys[0]]) ){
  //               // console.log(newBodyF);
  //               searchArr.push(newBodyF);
  //             }
        
  //           } else {
  //             resolve();
  //           }
  //         })
  //        })
         
  //         docRes.then(() => {
  //           client.emit('loadsearch', searchArr);
  //         })
  
  //     })
  //     //
      
  //   }
  // });
});

