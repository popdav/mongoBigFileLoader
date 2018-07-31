import React, { Component } from 'react';
import './App.css';
import '../node_modules/bootstrap/dist/css/bootstrap.min.css';
import Pagination from "react-js-pagination";
import ObjElements from './ObjElements';
import axios from 'axios';


class Table extends Component {
  constructor(props) {
    super(props);
    this.state = {
      showing: props.showing,
      data: [],
      activePage: 1,
      perPage: 5,
      positionInFile: 0,
      fileLines: 0,
      showFunc: props.showFunc,
    }
    Table.receiveFiles = Table.receiveFiles.bind(this);
    this.handlePageChange = this.handlePageChange.bind(this);
    this.handlePerPageChange = this.handlePerPageChange.bind(this);
    this.handleDivClick = this.handleDivClick.bind(this);
  }

  handleDivClick(e) {
    e.preventDefault();
    this.state.showFunc();
  }

  static receiveFiles(d) {
    this.setState({
      path: d.path,
      arrayOfObjProps: d.arrayOfObjProps,
      positionInFile: d.pos + 1
    });

    axios.post('/fileLines', {path: d.path})
    .then((res) => {
      this.setState({fileLines: res.data-1});
    })
    .catch((err) => {
      console.log(err);
    })

    let newFileBody = {
      path: d.path,
      arrayOfObjProps: d.arrayOfObjProps,
      positionInFile: d.pos+1,
      perPage: this.state.perPage,
      activePage: this.state.activePage
    }
    axios.post('/fileData', newFileBody)
      .then((res) => {
        this.setState({
          data: res.data.data,
        });
      })
      .catch((err) => {
        console.log(err);
      })



  }


  handlePageChange = (pageNumber) => {
    let newFileBody = {
      path: this.state.path,
      arrayOfObjProps: this.state.arrayOfObjProps,
      positionInFile: this.state.positionInFile,
      perPage: this.state.perPage,
      activePage: pageNumber
    }
    axios.post('/fileData', newFileBody)
      .then((res) => {
        
        this.setState({
          data: res.data.data,
          activePage: pageNumber
        });
      })
      .catch((err) => {
        console.log(err);
      })
  }

  handlePerPageChange = (event) => {
    event.persist();
    let newNum = event.target.value;
    let newFileBody = {
      path: this.state.path,
      arrayOfObjProps: this.state.arrayOfObjProps,
      positionInFile: this.state.positionInFile,
      perPage: newNum,
      activePage: 1
    }
    axios.post('/fileData', newFileBody)
      .then((res) => {
        this.setState({
          data: res.data.data,
          perPage: newNum,
          activePage: 1
        });
      })
      .catch((err) => {
        console.log(err);
      })
    
  }

  render() {
    let styleT = {display: "block"};
    if(!this.props.showing)
      styleT = {display: "none"};

    let objPropsArr = [];
    for(let x in this.state.data[0]){
      objPropsArr.push(x);
    }
    
    return (
      <div className="Table" style={styleT}>
        <button className="btn btn-primary btn-lg" onClick={this.handleDivClick}>Back</button>
        <br/>
        <label>
            Select number of rows: <select value={this.state.perPage} onChange={this.handlePerPageChange}>
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={15}>15</option>
              <option value={20}>20</option>
              <option value={25}>25</option>
            </select>
          </label>
        <table className="table table-bordered table-style table-hover">
          <tbody><tr>{objPropsArr.map((e, i) => {
            return (
              <th key={i}>{e}</th>
            )
          })}</tr>
          {this.state.data.map((e) => {
            return (
              <ObjElements obj={e} arr={objPropsArr} key={Math.random().toString(36).substr(2, 9)}/>
            )
          })}

          </tbody>
        </table>
        <div className="Pagination">
          <Pagination
                activePage={this.state.activePage}
                itemsCountPerPage={this.state.perPage}
                totalItemsCount={this.state.fileLines}
                onChange={this.handlePageChange}

          />
        </div>
      </div>
    );
  }
}


export default Table;
