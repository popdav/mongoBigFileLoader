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

MongoClient.connect("mongodb://localhost", (err, client) => {
  if(err)
    throw err;

    bigDataDb = client.db('bigData');
    gridfs = Grid(bigDataDb, Mongo);
    bigDataDb.collection('fs.files').find().toArray(function(err, files) {
      if (err)
        throw err;

      filesArr = files;
    });
})

app.get('/files', (req, res) => {
  res.send(filesArr);
})

app.post('/fileData', (req, res) => {
  let fName = req.body.name;
  let file = fileNameSearch(filesArr, fName);
  gridfs.readFile(file.filename, (err, data) => {
    if (err)
      throw err;
      
    let stringToJSON = JSON.parse(data);
    res.send(stringToJSON);
  })

  // let readStream = gridfs.createReadStream({
  //   _id: filesArr[0]._id,
  //   range: {
  //     startPos: 0,
  //     endPos: 10
  //   }
  // })
  // readStream.on('data', (chunk) => {
  //   console.log(chunk);
  // })
  //   res.send(buff);


})

app.listen(port, () => console.log(`Listening on port ${port}`));

function fileNameSearch(arr = [],  name) {
  for (let i = 0; i < arr.length; i++) {
    if(arr[i].filename === name)
      return arr[i];
  }
}
