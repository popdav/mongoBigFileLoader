import React, { Component } from 'react';
import './App.css';
import '../node_modules/bootstrap/dist/css/bootstrap.min.css';
import Files from './Files';
import Table from './Table';


class App extends Component {
  constructor() {
    super();
    this.state = {
      filesShow: true,
      tableShow: false
    }
    App.showChange = App.showChange.bind(this);
  }

  static showChange() {

    this.setState({
      filesShow: !this.state.filesShow,
      tableShow: !this.state.tableShow
    })
  }

  render() {
    return (
      <div>
        <Files showing={this.state.filesShow} />
        <Table showing={this.state.tableShow} />
      </div>
    );
  }
}

export default App;
