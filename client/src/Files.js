import React, { Component } from 'react';
import './App.css';
import '../node_modules/bootstrap/dist/css/bootstrap.min.css';
import Cell from './Cell';


class Files extends Component {
  constructor(props) {
    super(props);
    this.state = {
      files: [],
      showing: props.showing,
    }

  }

  componentDidMount() {

    this.callFiles()
      .then(res => {
        this.setState({ files: res});
      })
      .catch(err => console.log(err));
  }


  callFiles = async () => {
    const response = await fetch('/files');
    const body = await response.json();
    if (response.status !== 200) throw Error(body.message);

    return body;
  }

  render() {
    let styleT = {display: "block"};
    if(!this.props.showing)
      styleT = {display: "none"};
    const f = this.state.files;
    return (
      <div className="App">
        <table className="table  table-style table-hover" style={styleT}>
          <tbody><tr><th>Files:</th></tr></tbody>
          {
            f.map((elm) => {
              return (
                <Cell key={elm._id} elm={elm} showing={this.props.showing}/>
              );
            })
          }
        </table>
      </div>
    );
  }
}

export default Files;
