import React, { Component } from 'react';
import './App.css';
import '../node_modules/bootstrap/dist/css/bootstrap.min.css';
import axios from 'axios';
import App from './App';
import Table from './Table';


class Cell extends Component {
  constructor(props) {
    super(props);
    this.state = {
      element: props.elm,
      showing: props.showing,
    }
    this.onCellClick = this.onCellClick.bind(this);
    this.delClick = this.delClick.bind(this);
  }

  onCellClick(e) {
    e.preventDefault();
    const name = this.state.element.filename;
    axios.post('/fileData', {name: name})
      .then((res) => {
        Table.receiveFiles(res.data);
      })
      .catch((err) => {
        console.log(err);
      })

    App.showChange();
  }

  delClick() {

    axios.post('/delete', this.state.element)
      .then((res) => {
        console.log(res);
      })
      .catch((err) => {
        console.log(err);
      });
      
    this.props.func();

  }




  render() {
    let styleT = {display: "block"};
    if(!this.props.showing)
      styleT = {display: "none"};

    return (
      <tbody>
        <tr style={styleT}>
          <td onClick={this.onCellClick}>{this.state.element.path}</td>
          <td> <input type="submit" value="Delete" className={'btn btnSubmit'} onClick={this.delClick}/></td>
        </tr>
      </tbody>
    );
  }
}

export default Cell;
