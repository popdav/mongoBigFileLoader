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
  path: String,
  postion_list: Array
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
  if (!fs.existsSync(req.body.path)) {
    console.log("File does not exist!");
    res.status(400).send("File does not exist!");
    return;
  }
  let fd = fs.openSync(req.body.path, 'r');
  let posInFile = 0;
  let readBytes = 0;
  let buffr = new Buffer(128);
  let bodyPos = {
    start: 0,
    end: 0
  }
  let arrPos = [];
  for(let i=0; (readBytes = fs.readSync(fd, buffr, 0, buffr.length, posInFile)) > 0; i++) {

      let line = buffr.toString();
      let firstNewLine = line.indexOf("\n");
      delimiter = CSV.detect(line);
      line = line.slice(0, firstNewLine);
      
      posInFile += line.length + 1;
      if(i !== 0 && i % 100 === 0) {
        bodyPos.end = posInFile
        let newBodyPos = {
          start: bodyPos.start,
          end: bodyPos.end
        }
       
        arrPos.push(newBodyPos);
        bodyPos.start = posInFile;
        
      } else if(i === 0) {
        bodyPos.start = posInFile;
      }
      
      
  }

  let sendBody = {
    path: req.body.path,
    postion_list: arrPos
  }
  let myData = new File(sendBody);
  myData.save()
      .then(item => {
          // console.log(item);
          res.send("1");
          
      })
      .catch(err => {
          res.status(400).send("Unable to save to database");
      });
  
});

app.post("/delete", (req, res) => {
  File.findOneAndRemove({path: req.body.path},  (err) => {
    if (err) return handleError(err);
    res.send("1");
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
  File.findOne({path: filePath}, (err, file) => {
    if(err) throw err;

    const bodyStartEnd = file.postion_list[req.body.activePage-1];
    let fd = fs.openSync(filePath, 'r');
    let lines = [];
    let posInFile = bodyStartEnd.start;
    while(posInFile != bodyStartEnd.end) {
      let buffr = new Buffer(128);
      let readBytes = fs.readSync(fd, buffr, 0, buffr.length, posInFile);
      
      if(readBytes > 0) {      
        let line = buffr.slice(0, readBytes).toString();
        let firstNewLine = line.indexOf("\n");
        delimiter = CSV.detect(line);
        line = line.slice(0, firstNewLine);
        
        posInFile += line.length + 1;
        
        line = line.split(new RegExp(delimiter, "g"));
        
        let obj = {};
        for(let j=0; j<req.body.arrayOfObjProps.length; j++) {
          if(line[j].charAt(0) === '"' && line[j].charAt(line[j].length-1) === '"'){
            line[j] = line[j].substring(1, line[j].length-1)
          }
          obj[req.body.arrayOfObjProps[j]] = line[j];
          
        }
        
        lines.push(obj);
  
      } else {
        res.status(400).send("Unable to read file!");
      }
    }

    const objectToSend = {
      pos: posInFile,
      data: lines
    };
    res.send(objectToSend);

  })
})

app.listen(port, () => console.log(`Listening on port ${port}`));
