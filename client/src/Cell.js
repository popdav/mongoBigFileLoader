import React, { Component } from 'react';
import './App.css';
import '../node_modules/bootstrap/dist/css/bootstrap.min.css';
import axios from 'axios';
import { connect } from 'react-redux';
import { cellToTableTransfer } from './actions/cellTableActions';
import PropTypes from 'prop-types';


class Cell extends Component {
  constructor(props) {
    super(props);
    this.state = {
      element: props.elm,
      showing: props.showing,
      arrayOfObjProps: "",
      showFunc: props.showFunc,
    }
    this.onCellClick = this.onCellClick.bind(this);
    this.delClick = this.delClick.bind(this);
  }

  componentDidMount() {

    axios.post('/fileProps', {path: this.state.element})
      .then((res) => {
        // console.log(res.data);
        this.setState({arrayOfObjProps: res.data});
      })
      .catch((err) => {
        console.log(err);
      })
    
  }

  onCellClick(e) {
    e.preventDefault();
    const fBody = {
      path: this.state.element,
      arrayOfObjProps: this.state.arrayOfObjProps.split(" "),
      pos: this.state.arrayOfObjProps.length
    }
    axios.post('/fileExist', fBody)
    .then((res) => {
      if(res.data === 1) {
        //ubaciti redux
        this.props.cellToTableTransfer(fBody);
        this.state.showFunc();
      } else {
        alert("File does not exist!");
      }
    })
    .catch((err) => {
      console.log(err);
    })
  }

  delClick() {
    console.log(this.state.element);
    axios.post('/delete', {path: this.state.element})
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
          <td onClick={this.onCellClick}>{this.state.element}</td>
          <td> <input type="submit" value="Delete" className={'btn btnSubmit'} onClick={this.delClick}/></td>
        </tr>
      </tbody>
    );
  }
}

Cell.propTypes = {
  cellToTableTransfer: PropTypes.func.isRequired
}

export default connect(null, { cellToTableTransfer })(Cell);
