import React, { Component } from 'react';
import './App.css';
import '../node_modules/bootstrap/dist/css/bootstrap.min.css';
import Pagination from "react-js-pagination";
import ObjElements from './ObjElements';
import axios from 'axios';

import { connect } from 'react-redux';
import PropTypes from 'prop-types';


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
      active100: 1,
    }
    
    this.handlePageChange = this.handlePageChange.bind(this);
    this.handlePerPageChange = this.handlePerPageChange.bind(this);
    this.handleDivClick = this.handleDivClick.bind(this);
    this.handleScroll = this.handleScroll.bind(this);
  }

  handleDivClick(e) {
    e.preventDefault();
    this.setState({
      activePage: 1,
      active100: 1,
      perPage: 5,
    })
    this.state.showFunc();
  }

  componentWillReceiveProps(nextProps)  {
    if(nextProps.data.data) {
      this.setState({
        activePage: 1,
        path: nextProps.data.data.path,
        arrayOfObjProps: nextProps.data.data.arrayOfObjProps,
        positionInFile: nextProps.data.data.pos + 1,
        active100: 1
      });

      axios.post('/fileLines', {path: nextProps.data.data.path})
      .then((res) => {
        
        this.setState({fileLines: res.data-1});
      })
      .catch((err) => {
        console.log(err);
      })

      let newFileBody = {
        path: nextProps.data.data.path,
        arrayOfObjProps: nextProps.data.data.arrayOfObjProps,
        positionInFile: nextProps.data.data.pos+1,
        perPage: this.state.perPage,
        activePage: this.state.active100,
        active100: this.state.active100
      }
      console.log(newFileBody);
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

  }


  handlePageChange = (pageNumber) => {
    
    let active100data = Math.floor(this.state.perPage * pageNumber / 100) + 1;
    if(pageNumber <= 0)
      pageNumber = 1;

    if(pageNumber > Math.ceil(this.state.fileLines / this.state.perPage))
      pageNumber = Math.ceil(this.state.fileLines / this.state.perPage);
    
    if((this.state.perPage * pageNumber % 100 !== 0  && Math.floor(this.state.perPage * pageNumber / 100) + 1 !== this.state.active100)
       || Math.ceil(this.state.fileLines / this.state.perPage) === pageNumber 
       || (pageNumber < this.state.activePage && this.state.perPage * pageNumber % 100 === 0)){
      
      if((Math.ceil(this.state.fileLines / this.state.perPage) === pageNumber && this.state.fileLines % 100 === 0)
      || (pageNumber < this.state.activePage 
      && this.state.perPage * pageNumber % 100 === 0 && this.state.fileLines % 100 === 0))
        active100data--;

      let newFileBody = {
        path: this.state.path,
        arrayOfObjProps: this.state.arrayOfObjProps,
        positionInFile: this.state.positionInFile,
        perPage: this.state.perPage,
        activePage: active100data
      }

        
      axios.post('/fileData', newFileBody)
        .then((res) => {
          console.log(res.data);
          this.setState({
            data: res.data.data,
            activePage: pageNumber,
            active100: active100data
          });
        })
        .catch((err) => {
          console.log(err);
        })
    } else {
      this.setState({
        activePage: pageNumber,
      });
    }
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
          activePage: 1,
          active100: 1
        });
      })
      .catch((err) => {
        console.log(err);
      })
    
  }

  componentDidMount = () => {
    window.addEventListener('wheel', this.handleScroll);
  }

  componentWillUnmount = () => {
      window.removeEventListener('wheel', this.handleScroll);
  }

  handleScroll = (event) => {
      event.preventDefault();
      if(event.wheelDelta > 0) {
        this.handlePageChange(this.state.activePage+1);
      } else if(event.wheelDelta < 0) {
        this.handlePageChange(this.state.activePage - 1)
      }
  }

  render() {
    let styleT = {display: "block"};
    if(!this.props.showing)
      styleT = {display: "none"};

    let objPropsArr = [];
    for(let x in this.state.data[0]){
      objPropsArr.push(x);
    }

    const arr = this.state.data;
    const currPage = this.state.activePage;
    const perPage = this.state.perPage;

    const indeOfLast = currPage * perPage - (this.state.active100 - 1) * 100;
    const indexOdfFirst = indeOfLast - perPage;
    const subArr = arr.slice(indexOdfFirst, indeOfLast);
    
    return (
      <div className="Table" style={styleT} >
        <button className="btn btn-primary btn-lg" onClick={this.handleDivClick}>Back</button>
        <br/>
        <label>
            Select number of rows: <select value={this.state.perPage} onChange={this.handlePerPageChange}>
              <option value={5}>5</option>
              <option value={10}>10</option>
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
          {subArr.map((e) => {
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

Table.propTypes = {
  data: PropTypes.object.isRequired
}

const mapStateToProps = state => ({
  data: state.data
})

 export default connect(mapStateToProps, {})(Table);


