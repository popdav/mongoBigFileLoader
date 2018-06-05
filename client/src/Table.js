import React, { Component } from 'react';
import './App.css';
import '../node_modules/bootstrap/dist/css/bootstrap.min.css';
import App from './App';
import Pagination from "react-js-pagination";
import ObjElements from './ObjElements';


class Table extends Component {
  constructor(props) {
    super(props);
    this.state = {
      showing: props.showing,
      data: [],
      activePage: 1,
      perPage: 5,
    }
    Table.receiveFiles = Table.receiveFiles.bind(this);
    this.handlePageChange = this.handlePageChange.bind(this);
  }

  handleDivClick(e) {
    e.preventDefault();
    App.showChange();
  }

  static receiveFiles(d) {
    this.setState({
      data: d
    });
    console.log(this.state);
  }

  handlePageChange = (pageNumber) => {
    this.setState({activePage: pageNumber});
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

    const indeOfLast = currPage * perPage;
    const indexOdfFirst = indeOfLast - perPage;
    const subArr = arr.slice(indexOdfFirst, indeOfLast);



    return (
      <div style={styleT}>
        <button className="btn btn-primary" onClick={this.handleDivClick}>Back</button>
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

        <Pagination
              activePage={this.state.activePage}
              itemsCountPerPage={this.state.perPage}
              totalItemsCount={this.state.data.length}
              onChange={this.handlePageChange}

            />

      </div>
    );
  }
}


export default Table;
