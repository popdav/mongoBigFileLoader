import React, { Component } from 'react';

import '../node_modules/bootstrap/dist/css/bootstrap.min.css';
import './App.css';


class ObjElements extends Component {
  constructor(props) {
    super(props);
    this.state = {
      obj: props.obj,
      p: props.arr
    }
    this.checkForObject = this.checkForObject.bind(this);
  }

  checkForObject(obj) {
    let newObj = obj;
    let s = '';
    if(typeof(newObj) === 'object'){

      for(let x in newObj){
          if(typeof(newObj[x]) === 'object')
            s += this.checkForObject(newObj[x]);
          else
            s += x + ': ' + newObj[x] + '\n';
      }
    } else {
      s = newObj + '\n';
    }

    return s;
  }

  render() {
    let objArrProps = [];
    for (var i = 0; i < this.state.p.length; i++) {
      objArrProps.push(this.state.obj[this.state.p[i]]);
    }
    return (
      <tr>
        {Object.keys(this.state.obj).map((os, i) => {
          return (
            <td key={i}>{this.checkForObject(this.state.obj[os]).toString()}</td>
          )
        })}
      </tr>
    );
  }
}

export default ObjElements;
