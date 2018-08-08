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
const CSV = require('csv-string');
const port = process.env.PORT || 5000;

let delimiter = ',';

app.use(express.static(__dirname + '/public'));
app.use('/bower_components', express.static(__dirname + '/bower_components'));
app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.text());
app.use(bodyParser.json({type: 'application/vnd.api+json'}));
app.use(methodOverride());

mongoose.Promise = global.Promise;
mongoose.connect("mongodb://localhost:27017/fileList");

let fileListSchema = new mongoose.Schema({
  path: String
});

let File = mongoose.model("File", fileListSchema);

app.get("/files", (req, res) => {
  File.find((err, list) => {
    if(err) throw err;

    res.send(list);
  })
});

app.post("/fileExist", (req, res) => {
  
    if (fs.existsSync(req.body.path)) {
        res.send("1");
        return;
    } 

    res.send("0");
})

app.post("/add", (req, res) => {
  var myData = new File(req.body);
  myData.save()
      .then(item => {
          console.log(req.body);
      })
      .catch(err => {
          res.status(400).send("Unable to save to database");
      });
});

app.post("/delete", (req, res) => {
  File.findOneAndRemove(req.body, function (err) {
    if (err) return handleError(err);
  });
})

app.post("/fileProps", (req, res) => {
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
      }

      fs.close(fd, (err) => {
        if(err) throw err;
      });

      res.send(line);

    })

  })
})

app.post("/fileLines", (req, res) => {
  let count = 0;
  fs.createReadStream(req.body.path)
  .on('data', (chunk) => {
    for (let i = 0; i < chunk.length; i++) {
      if(chunk[i] == 10) count++;
      
    }
  })
  .on('end', () => {
    res.send(count + "");
  })
})

app.post("/fileData", (req, res) => {
  const filePath = req.body.path;

  let fd = fs.openSync(filePath, 'r');
  let lines = [];
  let posInFile = req.body.positionInFile;
  for(let i=0; i < req.body.activePage * req.body.perPage; i++) {
    
    let buffr = new Buffer(128);
    let readBytes = fs.readSync(fd, buffr, 0, buffr.length, posInFile);
    
    if(readBytes > 0) {
      let line = buffr.slice(0, readBytes).toString();
      let firstNewLine = line.indexOf("\n");
      delimiter = CSV.detect(line);
      line = line.slice(0, firstNewLine).replace(new RegExp(delimiter, "g"), " ");
      
      posInFile += line.length + 1;
      
      line = line.split(" ");
      let obj = {};
      for(let j=0; j<req.body.arrayOfObjProps.length; j++) {
        obj[req.body.arrayOfObjProps[j]] = line[j];
        
      }
      
      if(i >= (req.body.activePage-1)*req.body.perPage && i < req.body.activePage * req.body.perPage)
        lines.push(obj);

    }
  }
  const objectToSend = {
    pos: posInFile,
    data: lines
  };
  res.send(objectToSend);
})

app.listen(port, () => console.log(`Listening on port ${port}`));
