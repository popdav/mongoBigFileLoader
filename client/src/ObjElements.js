import React, { Component } from 'react';
import './App.css';
import '../node_modules/bootstrap/dist/css/bootstrap.min.css';


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
    if(typeof(newObj) === 'object')
      newObj = JSON.stringify(newObj);

    return newObj;
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
// _renderObject(){
//     return Object.keys(ObjectTest).map(obj, i) => {
//         return (
//             <div>
//                 id is: {ObjectTest[obj].id} ;
//                 name is: {ObjectTest[obj].name}
//             </div>
//         )
//     })
// }
export default ObjElements;
