import React, { Component } from 'react';
import { Provider } from 'react-redux';

import '../node_modules/bootstrap/dist/css/bootstrap.min.css';
import './App.css';

import Files from './Files';
import Table from './Table';

import store from './store';

class App extends Component {
  constructor() {
    super();
    this.state = {
      filesShow: true,
      tableShow: false,
      tableData: {}
    }
    this.showChangeProp = this.showChangeProp.bind(this);
  }


  showChangeProp() {

    this.setState({
      filesShow: !this.state.filesShow,
      tableShow: !this.state.tableShow
    })
  }

  render() {
    
    return (
      <Provider store={store}>
        <div>
          <Files showing={this.state.filesShow} showFunc={this.showChangeProp} />
          <Table showing={this.state.tableShow} showFunc={this.showChangeProp} />
        </div>
      </Provider>
    );
  }
}

export default App;
