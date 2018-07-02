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

app.listen(port, () => console.log(`Listening on port ${port}`));
