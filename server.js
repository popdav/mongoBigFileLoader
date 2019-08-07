const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const Mongo = require('mongodb');
const MongoClient = Mongo.MongoClient;
const fs = require('fs');
const es = require('event-stream');
const app = express();
const CSV = require('csv-string');
const readline = require('readline');
const Promise = require('promise');
const port = process.env.PORT || 5000;

let delimiter = ',';

app.use(express.static(__dirname + '/public'));
app.use('/bower_components', express.static(__dirname + '/bower_components'));
app.use(morgan('dev'));
app.use(bodyParser.json());

app.use(bodyParser.json({ limit: '100gb', extended: true, parameterLimit: 50000000000 }));
app.use(bodyParser.urlencoded({ limit: '100gb', extended: true, parameterLimit: 50000000000 }));
app.use(methodOverride());

const server = app.listen(port, () => console.log(`Listening on port ${port}`));
const io = require('socket.io')(server);
//
const buffSize = 4096; //konstanta za velicinu bafera
let dbOff; //konstanta za mongo bazu
MongoClient.connect("mongodb://localhost:27017/", { useNewUrlParser: true }, (err, db) => {
  if (err) throw err;
  dbOff = db.db("fileListOffset");
});

//post poziv za dodavanje niz offseta u mongo i njihovo indeksiranje 
app.post('/addoff', (req, res) => {
  const filepath = req.body.path;
  //provera da li fajl vec postoji
  if (!fs.existsSync(filepath)) {
    console.log("\x1b[31m", { fileExists: false });
    res.send({ fileExists: false });
    return;
  }
  let start = Date.now();
  //
  let insertArr = [];
  let insertPromisArr = [];
  let offsetInFile = 0;
  let lineNum = 0;
  let inc = 1;

  let readStream = fs.createReadStream(filepath)
    .pipe(es.split())
    .pipe(es.mapSync((line) => {
      if (line !== '') {
        readStream.pause();
        if (lineNum == 0) {
          delimiter = CSV.detect(line);
          let fd = fs.openSync(filepath, 'r');
          let readBytes = 0;
          let buffr = new Buffer(buffSize);
          let fieldNames = [];
          readBytes = fs.readSync(fd, buffr, 0, buffr.length, 0);
          let lineF = buffr.toString();
          let firstNewLineF = lineF.indexOf("\n");
          lineF = lineF.slice(0, firstNewLineF);
          if (lineF.indexOf('\r') >= 0)
            inc = 2;
          else
            inc = 1;
        } else {
          insertArr.push({ _id: offsetInFile });
          if (insertArr.length % 1000 === 0) {
            insertPromisArr.push(new Promise((resolve1, reject1) => {
              dbOff.collection(filepath).insertMany(insertArr, (err, result) => {
                let end = Date.now();
                console.log("\x1b[32m", "TIME: ", (end - start) / 1000)
                console.log(lineNum - 1)


              });
              resolve1();
            }))

            insertArr = [];
          }

        }
        offsetInFile += line.length + inc;
        lineNum++;
        readStream.resume();
      }
    }))
    .on('error', (err) => {
      console.log('Error: ' + err);
    })
    .on('end', () => {
      if (insertArr.length > 0) {
        insertPromisArr.push(new Promise((resolve1, reject1) => {
          dbOff.collection(filepath).insertMany(insertArr)
            .then(() => {
              resolve1();
            })
            .catch((err) => {
              console.log(err);
            })
        }))
      }
      Promise.all(insertPromisArr).then(() => {
        console.log("\x1b[33m", insertPromisArr.length)
        res.send({ file_added: true }).bind(res);
      })
    })

})

//poziv za slanje podataka
app.post('/filedataoffset', (req, res) => {
  const fileName = req.body.path;
  let wh = req.body.activePage - 1;
  if (wh < 0) wh = 0;
  // console.log(req.body.searchQuery)
  let options = {
    "limit": 100,//limitrano na 100 podataka
    "skip": wh * 100,//kojih 100 uzimamo
    "sort": [[req.body.sortBy, req.body.sorting]]
  }
  console.log("\x1b[32m", "Options:")
  console.log(options);
  console.log(req.body)


  let br = -1;
  if (req.body.sorting === 'asc')
    br = 1;

  let searchQueryKeys = [];
  if (req.body.searchQuery !== null) {
    searchQueryKeys = Object.keys(req.body.searchQuery);
    if (!isNaN(req.body.searchQuery[searchQueryKeys[0]]) && req.body.searchQuery[searchQueryKeys[0]] != '') { //provera da li je broj
      req.body.searchQuery[searchQueryKeys[0]] = Number(req.body.searchQuery[searchQueryKeys[0]]);
    }
  }
  if (req.body.sortBy !== null) {
    dbOff.collection(fileName).ensureIndex({ [req.body.sortBy]: 1 });
  }
  let bodyArrFin = [];

  let sendPromise = new Promise((resolve, reject) => {
    console.log(br)
    if (req.body.searchQuery !== null) {
      dbOff.collection(fileName).findOne({}, (err, doc) => {
        if (err) throw err;
        if (doc[searchQueryKeys[0]] !== null && doc[searchQueryKeys[0]] !== undefined) {
          dbOff.collection(fileName).find(req.body.searchQuery).sort({ [req.body.sortBy]: br }).limit(100).skip(options.skip).toArray((err, docs) => {
            if (err) throw err;
            // bodyArrFin = docs;
            console.log(req.body.searchQuery)
            console.log(docs.length)
            //uzimanje podataka iz fajla
            let fd = fs.openSync(fileName, 'r');
            let posInFile = 0;
            let readBytes = 0;
            let buffr = new Buffer(buffSize);
            // console.log(docs);
            //uzimanje polja iz fajla
            let fieldNames = [];
            readBytes = fs.readSync(fd, buffr, 0, buffr.length, 0);
            let lineF = buffr.toString();
            let firstNewLineF = lineF.indexOf("\n");
            lineF = lineF.slice(0, firstNewLineF);
            delimiter = CSV.detect(lineF);//provera za delimiter
            lineF = lineF.replace(new RegExp('"', "g"), "");
            fieldNames = lineF.split(new RegExp(delimiter, "g"));

            for (let i = 0; i < docs.length; i++) {
              //citanje linija po linija
              readBytes = fs.readSync(fd, buffr, 0, buffr.length, docs[i]._id);
              let line = buffr.toString();
              let firstNewLine = line.indexOf("\n");

              line = line.slice(0, firstNewLine);

              line = line.split(new RegExp(delimiter, "g"));
              // console.log(docs[i]);
              //parsiranje u JSON objekat
              let newBodyF = {};
              for (let j = 0; j < fieldNames.length; j++) {
                if (line[j]) {
                  newBodyF[fieldNames[j]] = line[j].replace(new RegExp('"', 'g'), ''); // zamena navodnika sa praznim stringom
                  if (!isNaN(newBodyF[fieldNames[j]]) && newBodyF[fieldNames[j]] != '') { //provera da li je broj
                    newBodyF[fieldNames[j]] = Number(newBodyF[fieldNames[j]]);
                  }
                } else {
                  newBodyF[fieldNames[j]] = '';
                }
              }


              bodyArrFin.push(newBodyF);

            }

            resolve();
          })
        }

      })
    } else {
      dbOff.collection(fileName).find().sort({ [req.body.sortBy]: br }).limit(100).skip(options.skip).toArray((err, docs) => {
        if (err) throw err;
        // bodyArrFin = docs;

        //uzimanje podataka iz fajla
        let fd = fs.openSync(fileName, 'r');
        let posInFile = 0;
        let readBytes = 0;
        let buffr = new Buffer(buffSize);
        // console.log(docs);
        //uzimanje polja iz fajla
        let fieldNames = [];
        readBytes = fs.readSync(fd, buffr, 0, buffr.length, 0);
        let lineF = buffr.toString();
        let firstNewLineF = lineF.indexOf("\n");
        lineF = lineF.slice(0, firstNewLineF);
        delimiter = CSV.detect(lineF);//provera za delimiter
        lineF = lineF.replace(new RegExp('"', "g"), "");
        fieldNames = lineF.split(new RegExp(delimiter, "g"));

        for (let i = 0; i < docs.length; i++) {
          //citanje linija po linija
          readBytes = fs.readSync(fd, buffr, 0, buffr.length, docs[i]._id);
          let line = buffr.toString();
          let firstNewLine = line.indexOf("\n");

          line = line.slice(0, firstNewLine);

          line = line.split(new RegExp(delimiter, "g"));
          // console.log(docs[i]);
          //parsiranje u JSON objekat
          let newBodyF = {};
          for (let j = 0; j < fieldNames.length; j++) {
            if (line[j]) {
              newBodyF[fieldNames[j]] = line[j].replace(new RegExp('"', 'g'), ''); // zamena navodnika sa praznim stringom
              if (!isNaN(newBodyF[fieldNames[j]]) && newBodyF[fieldNames[j]] != '') { //provera da li je broj
                newBodyF[fieldNames[j]] = Number(newBodyF[fieldNames[j]]);
              }
            } else {
              newBodyF[fieldNames[j]] = '';
            }
          }


          bodyArrFin.push(newBodyF);

        }

        resolve();
      })
    }

  })

  sendPromise.then(() => {
    // console.log(bodyArrFin[0])
    res.send(bodyArrFin);
  })


})

app.get("/files", (req, res) => {
  dbOff.listCollections().toArray((err, collInfos) => {
    let arrNames = [];
    for (let i = 0; i < collInfos.length; i++) {
      arrNames.push(collInfos[i].name);
    }
    res.send(arrNames);
  });
})

app.post('/indexed', (req, res) => {
  const fileName = req.body.path;
  let searchQueryKeys = [];
  if (req.body.searchQuery !== null) {
    searchQueryKeys = Object.keys(req.body.searchQuery);

    dbOff.collection(fileName).findOne({}, (err, doc) => {
      if (err) throw err;
      if (doc[searchQueryKeys[0]] !== null && doc[searchQueryKeys[0]] !== undefined) {
        res.send({ index: true })
      } else {
        res.send({ index: false })
      }
    })
  } else {
    res.send({ index: true })
  }
})

app.post("/delete", (req, res) => {
  let collName = req.body.path;
  dbOff.collection(collName).drop((err, delOK) => {
    if (err) throw err;
    if (delOK) console.log("\x1b[31m", "Collection deleted");
    res.send({ collection_deleted: true });
  });
})

app.post("/numofrecors", (req, res) => {
  let collName = req.body.path;
  dbOff.collection(collName).find(req.body.searchQuery).count((err, num) => {
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
  // console.log(req.body);
  fs.open(req.body.path, 'r', (err, fd) => {
    if (err) return console.log("\x1b[31m", err);

    let buffr = new Buffer(buffSize);

    fs.read(fd, buffr, 0, buffr.length, 0, (err, bytes) => {
      if (err) throw err;
      let line = "";
      if (bytes > 0) {
        line = buffr.slice(0, bytes).toString();
        let firstNewLine = line.indexOf("\n");
        line = line.slice(0, firstNewLine);
        delimiter = CSV.detect(line);
        line = line.split(new RegExp(delimiter, "g"));
        // line = line.replace(new RegExp('"', "g"), "");
      }

      fs.close(fd, (err) => {
        if (err) throw err;
      });
      console.log("\x1b[32m", "Field names: ");
      console.log(line)
      res.send(line);

    })

  })
})



//socket

io.on('connection', (client) => {
  console.log("\x1b[32m", 'Socket: Table.js connected');
  client.on('addsort', (body) => {
    let start = Date.now();
    const sortBy = body.sortBy;
    const fileName = body.path;
    console.log(body);

    dbOff.collection(fileName).findOne({}, (err, doc) => {
      if (err) throw err;
      if (doc[sortBy]) {
        client.emit('startsort', body);
        return false;
      } else {

        let i = 0;
        let fieldNames2 = [];
        let promiseArr = [];
        let inc = 1, offsetInFile = 0;


        let readStream = fs.createReadStream(fileName)
          .pipe(es.split())
          .pipe(es.mapSync((line) => {
            readStream.pause();
            if (i == 0) {

              delimiter = CSV.detect(line);//provera za delimiter
              line = line.replace(new RegExp('"', "g"), "");
              fieldNames2 = line.split(new RegExp(delimiter, "g"));

              let fd = fs.openSync(fileName, 'r');
              let readBytes = 0;
              let buffr = new Buffer(buffSize);

              readBytes = fs.readSync(fd, buffr, 0, buffr.length, 0);
              let lineF = buffr.toString();
              let firstNewLineF = lineF.indexOf("\n");
              lineF = lineF.slice(0, firstNewLineF);
              if (lineF.indexOf('\r') >= 0)
                inc = 2;
              else
                inc = 1;

            } else {
              linetmp = line;
              lineArr = line.split(new RegExp(delimiter, "g"));
              
              
              let newBodyF = {};
              for (let j = 0; j < fieldNames2.length; j++) {
                // console.log(fieldNames2[j] + ': ' + lineArr[j]);
                if (lineArr[j] !== undefined) {
                  newBodyF[fieldNames2[j]] = lineArr[j].replace(new RegExp('"', 'g'), ''); // zamena navodnika sa praznim stringom
                  if (!isNaN(newBodyF[fieldNames2[j]]) && newBodyF[fieldNames2[j]] != '') { //provera da li je broj
                    newBodyF[fieldNames2[j]] = Number(newBodyF[fieldNames2[j]]);
                  }
                } else {
                  newBodyF[fieldNames2[j]] = '';
                }
              }

              let newValObj = {};
              newValObj[sortBy] = newBodyF[sortBy];
              const newVal = { $set: newValObj };
              
              promiseArr.push(new Promise((resolve1, reject1) => {
                dbOff.collection(fileName).updateOne({ _id: offsetInFile }, newVal, (err, resu) => {
                  if (err) throw err;
                  let end = Date.now();
                  console.log("\x1b[32m", "TIME: ", (end - start) / 1000)
                  resolve1();
                })
              }))

            }
            i++;
            offsetInFile += line.length + inc;
            readStream.resume();
          }))
          .on('error', (err) => {
            console.log('Error: ' + err);
          })
          .on('end', () => {
            Promise.all(promiseArr).then(() => {
              console.log('close');
              let end = Date.now();
              console.log("\x1b[32m", "TIME: ", (end - start) / 1000)
              client.emit('startsort', body);
            })

          })

      }
    })


  });

});

module.exports = {app,io};