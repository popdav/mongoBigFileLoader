import React, { Component } from 'react';

import '../node_modules/bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import Cell from './Cell';
import Pagination from "react-js-pagination";
import axios from 'axios';

class Files extends Component {
  constructor(props) {
    super(props);
    this.state = {
      files: [],
      addFile: '',
      showing: props.showing,
      activePage: 1,
      perPage: 20,
      showFunc: props.showFunc,
    }
    this.handlePageChange = this.handlePageChange.bind(this);
    this.handelAddFormInput = this.handelAddFormInput.bind(this);
    this.refrFiles = this.refrFiles.bind(this);
    this.handleAddClick = this.handleAddClick.bind(this);
    this.handleCloseClick = this.handleCloseClick.bind(this);
    this.loadingRef = React.createRef();
    this.addForm = React.createRef();
    this.inputAddForm = React.createRef();
  }

  componentDidMount() {
    this.loadingRef.current.style.display = "block";
    this.callFiles()
      .then(res => {
        this.setState({ files: res});
        this.loadingRef.current.style.display = "none";
      })
      .catch(err => {
        this.loadingRef.current.style.display = "none";
        console.log(err);
      })
  }

  handelAddFormInput = (event) => {
    const target = event.target;
    const value = target.value;
    const name = target.name;
    console.log(name + ': ' + value)
    this.setState({
      [name]: value,
    });
  }

  handlePageChange = (pageNumber) => {
    this.setState({activePage: pageNumber});
  }

  callFiles = async () => {
    const response = await fetch('/files');
    const body = await response.json();
    if (response.status !== 200) throw Error(body.message);

    return body;
  }

  addToDb = (e) => {
    e.preventDefault();
    let newBody = {
      path: this.state.addFile,
    }

    console.log(newBody);
    this.loadingRef.current.style.display = "block";
    axios.post('/addoff', newBody)
    .then((response) => {
      console.log(response);
      if(response.data.fileExists === false)
        alert("File doesn't exist!")
      this.loadingRef.current.style.display = "none";
      this.refrFiles();
    })
    .catch((error) => {
      console.log(error);
      this.loadingRef.current.style.display = "none";
    });
    this.addForm.current.style.display = "none";
    this.inputAddForm.current.value = ""
    
  }

  refrFiles = () => {
    axios.get("/files")
    .then((res) => {
      
      this.setState({ 
        files: res.data,
        addFile: ''
      });
      console.log(this.state)
    })
    .catch((err) => {
      console.log(err);
    })
  }

  handleAddClick () {
    this.addForm.current.style.display = "block";
  }

  handleCloseClick () {
    this.addForm.current.style.display = "none";
  }

  render() {
    let styleT = {};
    if(!this.props.showing)
      styleT = {display: "none"};

    function handleOutForm () {
      // addForm.current.style.display = "none";
    }

    return (
      <div style={styleT} className="FilesTable">

        <button onClick={this.handleAddClick} className={'btn btnSubmit'}>Add file</button>
        <br/>
        <div className={'modal'} ref={this.addForm} onClick={handleOutForm}>
            <form className={'modal-content'}>
              <span onClick={this.handleCloseClick}  className="close">&times;</span>
              <label> File path: </label>
              <br/>
              <input type="text" className={"from-control"} ref={this.inputAddForm} name="addFile" onChange={this.handelAddFormInput}/>
              <br/>
              <input type="submit" value="Submit" className={'btn btn-danger btnSubmit'} onClick={this.addToDb}/>

            </form>
        </div>


        <div ref={this.loadingRef} className="loader"></div>
        <br/>
        <table className="table-style table-bordered table-hover TableFile" style={styleT}>
          <tbody>
           <tr><th colSpan="2">Files:</th></tr>
            {
              this.state.files.map((elm, i) => {
                return (
                  <Cell key={Math.random().toString(36).substr(2, 9)} elm={elm} showing={this.props.showing} func={this.refrFiles} showFunc={this.state.showFunc}/>
                );
              })
            } 

          </tbody>
        </table>

        <div className="FilesPaginaion">
        <Pagination
              activePage={this.state.activePage}
              itemsCountPerPage={this.state.perPage}
              totalItemsCount={this.state.files.length}
              onChange={this.handlePageChange}

        />
        </div>

      </div>
    );
  }
}

export default Files;
