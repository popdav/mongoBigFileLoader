import React, { Component } from 'react';
import './App.css';
import '../node_modules/bootstrap/dist/css/bootstrap.min.css';
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
    this.loadingRef = React.createRef();
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

  addToDb = () => {
    let newBody = {
      path: this.state.addFile,
    }

    console.log(newBody);
    this.loadingRef.current.style.display = "block";
    axios.post('/addoff', newBody)
    .then((response) => {
      console.log(response);
      this.loadingRef.current.style.display = "none";
    })
    .catch((error) => {
      console.log(error);
      this.loadingRef.current.style.display = "none";
    });
  }

  refrFiles = () => {
    axios.get("/files")
    .then((res) => {
      
      this.setState({ files: res.data});
    })
    .catch((err) => {
      console.log(err);
    })
  }

  render() {
    let styleT = {display: "block"};
    if(!this.props.showing)
      styleT = {display: "none"};

    let addForm = React.createRef();
    function handleAddClick () {
      addForm.current.style.display = "block";
    }
    

    function handleOutForm () {
      // addForm.current.style.display = "none";
    }


    return (
      <div style={styleT} className="FilesTable">

        <button onClick={handleAddClick} className={'btn btnSubmit'}>Add file</button>

        <div className={'modal'} ref={addForm} onClick={handleOutForm}>
            <form className={'modal-content'}>
              <div className={"form-group"}>
                <label>
                  File path: <input type="text" className={"form-control"} name="addFile" onChange={this.handelAddFormInput}/>
                </label>
              </div>
              <input type="submit" value="Submit" className={'btn btn-danger btnSubmit'} onClick={this.addToDb}/>
            </form>
        </div>


        <div ref={this.loadingRef} className="loader"></div>
        <table className=" table-hover " style={styleT}>
          <tbody><tr><th>Files:</th></tr></tbody>
          {
            this.state.files.map((elm) => {
              return (
                <Cell key={Math.random().toString(36).substr(2, 9)} elm={elm} showing={this.props.showing} func={this.refrFiles} showFunc={this.state.showFunc}/>
              );
            })
          }
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
