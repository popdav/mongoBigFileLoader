const chai = require('chai');
const chaiHttp = require('chai-http');
const {app, io} = require('../server');

const openSocket = require('socket.io-client');
let client = openSocket('http://localhost:5000');

chai.use(chaiHttp);
chai.should();
let expect = chai.expect;

const testFile = "/home/david/test-data/dir-sample.txt";
const testSort = "forename";

describe("Files", () => {
    it("should get if file exists", (done) => {
        chai.request(app)
            .post('/fileExist')
            .send({path: testFile})
            .end((err, res) => {
                res.should.have.status(200);
                done();
            })
    })
    it("should get all files", (done) => {
        chai.request(app)
            .get('/files')
            .end((err, res) => {
                res.should.have.status(200);
                res.body.should.be.a('array');
                done();
            })
    })
    it("should delete one file", (done) => {
        chai.request(app)
            .post('/delete')
            .send({path: testFile})
            .end((err, res) => {
                res.should.have.status(200);
                res.body.collection_deleted.should.be.true;
                done();
            })
    })

    it("should add one file", (done) => {
        chai.request(app)
            .post('/addoff')
            .send({path: testFile})
            .end((err, res) => {
                res.should.have.status(200);
                res.body.file_added.should.be.true;
                done();
            })
    })

    it("should get data of one file", (done) => {
        chai.request(app)
            .post('/filedataoffset')
            .send({
                path: testFile,
                activePage: 1,
                sortBy: '_id',
                sorting: 'asc',
                searchQuery: null
            })
            .end((err, res) => {
                res.should.have.status(200);
                res.body.should.be.a('array');
                done();
            })
    })

    it("should get if collection is indexed", (done) => {
        chai.request(app)
            .post('/indexed')
            .send({
                path: testFile,
                searchQuery: null
            })
            .end((err, res) => {
                res.should.have.status(200);
                res.body.index.should.be.a('boolean');
                done();
            })
    })

    it("should get number of records", (done) => {
        chai.request(app)
            .post('/numofrecors')
            .send({
                path: testFile,
                searchQuery: null
            })
            .end((err, res) => {
                res.should.have.status(200);
                done();
            })
    })

    it("should get file fields", (done) => {
        chai.request(app)
            .post('/fileProps')
            .send({
                path: testFile
            })
            .end((err, res) => {
                res.should.have.status(200);
                res.body.should.be.a('array');
                done();
            })
    })

    it("should test socket", (done) => {
        let newFileBody = {
            path: testFile,
            sortBy: testSort
          };
        client.emit('addsort', newFileBody);
        client.on('startsort', (body) => {
            expect(body).to.eql(newFileBody);
            done();
        })
    })
})