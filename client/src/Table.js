import React, { Component } from 'react';
import './App.css';
import '../node_modules/bootstrap/dist/css/bootstrap.min.css';
import App from './App';
import ObjElements from './ObjElements';


class Table extends Component {
  constructor(props) {
    super(props);
    this.state = {
      showing: props.showing,
      data: [],
    }
    Table.receiveFiles = Table.receiveFiles.bind(this);
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

  render() {
    let styleT = {display: "block"};
    if(!this.props.showing)
      styleT = {display: "none"};

    let objPropsArr = [];
    for(let x in this.state.data[0]){
      objPropsArr.push(x);
    }

    return (
      <div style={styleT}>
        <button className="btn btn-primary" onClick={this.handleDivClick}>Back</button>
        <table className="table table-bordered table-style table-hover">
          <tbody><tr>{objPropsArr.map((e, i) => {
            return (
              <th key={i}>{e}</th>
            )
          })}</tr>
          {this.state.data.map((e) => {
            return (
              <ObjElements obj={e} arr={objPropsArr} key={e._id}/>
            )
          })}

          </tbody>
        </table>
      </div>
    );
  }
}


export default Table;
