import React, { Component } from 'react';
import './App.css';
import '../node_modules/bootstrap/dist/css/bootstrap.min.css';
import Pagination from "react-js-pagination";
import ObjElements from './ObjElements';
import axios from 'axios';

import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import openSocket from 'socket.io-client';



class Table extends Component {
  constructor(props) {
    super(props);
    this.state = {
      showing: props.showing,
      data: [],
      activePage: 1,
      perPage: 5,
      fileLines: 0,
      showFunc: props.showFunc,
      active100: 1,
      sortBy: '_id',
      sorting: 'acs',
      list_sorting: 'asc',
      searchQuery: null,
      socket: openSocket('http://localhost:5000'),
      arrayOfObjProps: [],
      arrayOfObjPropsHeadline: []
    }

    this.handlePageChange = this.handlePageChange.bind(this);
    this.handlePerPageChange = this.handlePerPageChange.bind(this);
    this.handleDivClick = this.handleDivClick.bind(this);
    this.handleScroll = this.handleScroll.bind(this);
    this.onClickSort = this.onClickSort.bind(this);
    this.findQuery = this.findQuery.bind(this);
    this.handleFindChange = this.handleFindChange.bind(this);
    this.IsJsonString = this.IsJsonString.bind(this);
    this.resetClick = this.resetClick.bind(this);
    this.enterPress = this.enterPress.bind(this);

    this.loadingRef = React.createRef();
    this.findRef = React.createRef();
  }

  handleDivClick(e) {
    e.preventDefault();
    this.setState({
      activePage: 1,
      active100: 1,
      perPage: 5,
      path: '',
      data: [],
      sortBy: '_id',
      sorting: 'asc',
      searchQuery: null,
    })
    this.findRef.current.value = '';
    this.state.showFunc();
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.data.data) {
      this.loadingRef.current.style.display = "block";

      this.setState({
        activePage: 1,
        path: nextProps.data.data.path,
        arrayOfObjProps: nextProps.data.data.arrayOfObjProps,
        arrayOfObjPropsHeadline: nextProps.data.data.arrayOfObjProps,
        positionInFile: nextProps.data.data.pos + 1,
        active100: 1,
        sortBy: '_id',
        sorting: 'asc',
        searchQuery: null
      });


      let newFileBody = {
        path: nextProps.data.data.path,
        activePage: this.state.active100,
        sortBy: this.state.sortBy,
        sorting: this.state.sorting,
        searchQuery: null
      }

      axios.post('/filedataoffset', newFileBody)
        .then((res) => {
          this.setState({
            data: res.data,
          });

          axios.post('/numofrecors', { path: newFileBody.path })
            .then((res) => {
              console.log("usao")
              console.log(newFileBody)
              console.log(res.data)
              this.setState({ fileLines: res.data });
              this.loadingRef.current.style.display = "none";
            })
            .catch((err) => {
              console.log(err);
            })

        })
        .catch((err) => {
          console.log(err);
        })

    }

  }


  handlePageChange = (pageNumber) => {
    if (pageNumber <= 0)
      pageNumber = 1;

    if (pageNumber > Math.ceil(this.state.fileLines / this.state.perPage))
      pageNumber = Math.ceil(this.state.fileLines / this.state.perPage);

    let active100data = Math.floor(this.state.perPage * pageNumber / 100) + 1;

    if ((this.state.perPage * pageNumber % 100 !== 0 && Math.floor(this.state.perPage * pageNumber / 100) + 1 !== this.state.active100)
      || Math.ceil(this.state.fileLines / this.state.perPage) === pageNumber
      || (pageNumber < this.state.activePage && this.state.perPage * pageNumber % 100 === 0)) {
        console.log(this.state.fileLines)
      if ((Math.ceil(this.state.fileLines / this.state.perPage) === pageNumber /*&& this.state.fileLines % 2 === 0*/)
        || (pageNumber < this.state.activePage
          && this.state.perPage * pageNumber % 100 === 0)) {
        console.log("usao")
        active100data--;
      }


      let newFileBody = {
        path: this.state.path,
        activePage: active100data,
        sortBy: this.state.sortBy,
        sorting: this.state.list_sorting,
        searchQuery: JSON.parse(this.state.searchQuery)
      }
      console.log(newFileBody)
      this.loadingRef.current.style.display = "block";
      axios.post('/filedataoffset', newFileBody)
        .then((res) => {
          console.log(res.data);
          this.setState({
            data: res.data,
            activePage: pageNumber,
            active100: active100data
          });
          this.loadingRef.current.style.display = "none";
        })
        .catch((err) => {
          console.log(err);
        })
    } else {
      this.setState({
        activePage: pageNumber,
      });
    }
  }

  handlePerPageChange = (event) => {
    event.persist();
    let newNum = event.target.value;
    let newFileBody = {
      path: this.state.path,
      activePage: 1,
      sortBy: this.state.sortBy,
      sorting: this.state.sorting,
      searchQuery: JSON.parse(this.state.searchQuery)
    }


    this.loadingRef.current.style.display = "block";
    axios.post('/filedataoffset', newFileBody)
      .then((res) => {
        this.loadingRef.current.style.display = "none";
        console.log(res);
        this.setState({
          data: res.data,
          perPage: newNum,
          activePage: 1,
          active100: 1
        });
      })
      .catch((err) => {
        console.log(err);
      })

  }

  componentDidMount = () => {
    window.addEventListener('wheel', this.handleScroll);
  }

  componentWillUnmount = () => {
    window.removeEventListener('wheel', this.handleScroll);
  }

  handleScroll = (event) => {
    event.preventDefault();
    if (event.wheelDelta > 0) {
      this.handlePageChange(this.state.activePage + 1);
    } else if (event.wheelDelta < 0) {
      this.handlePageChange(this.state.activePage - 1)
    }
  }

  onClickSort(e, i) {
    e.preventDefault();


    let sortingtmp = this.state.sorting;
    if (this.state.sortBy !== this.state.arrayOfObjProps[i])
      sortingtmp = 'asc';


    this.setState({
      activePage: 1,
      sortBy: this.state.arrayOfObjProps[i]
    });




    let newFileBody = {
      path: this.state.path,
      activePage: 1,
      sortBy: this.state.arrayOfObjProps[i],
      sorting: sortingtmp,
      searchQuery: JSON.parse(this.state.searchQuery),
      fileLines: this.state.fileLines
    }
    this.loadingRef.current.style.display = "block";

    this.state.socket.emit('addsort', newFileBody);

    this.state.socket.on('startsort', (body) => {
      console.log(body);
      let tmpSort;
      let lsort = this.state.sorting;
      if (body.sorting === 'asc') {
        tmpSort = 'desc';
      }
      else {
        tmpSort = 'asc';
      }

      axios.post('/filedataoffset', body)
        .then((res) => {
          this.loadingRef.current.style.display = "none";
          console.log(res.data);
          let objPropsArr = [];
          for (let x = 0; x < this.state.arrayOfObjProps.length; x++) {
            if (this.state.arrayOfObjProps[x] === this.state.sortBy && body.sorting === 'asc') {
              objPropsArr.push(this.state.arrayOfObjProps[x] + " ↓");
            } else if (this.state.arrayOfObjProps[x] === this.state.sortBy && body.sorting === 'desc') {
              objPropsArr.push(this.state.arrayOfObjProps[x] + " ↑");
            } else {
              objPropsArr.push(this.state.arrayOfObjProps[x]);
            }
          }

          this.setState({
            data: res.data,
            activePage: 1,
            active100: 1,
            sorting: tmpSort,
            list_sorting: lsort,
            arrayOfObjPropsHeadline: objPropsArr
          });
          return;
        })
        .catch((err) => {
          console.log(err);
        })
    })
  }
  handleFindChange(event) {
    console.log(event.target.value)
    this.setState({ searchQuery: event.target.value });
  }
  findQuery() {
    console.log(this.state.searchQuery);
    // console.log(typeof JSON.parse(this.state.searchQuery));
    if (this.IsJsonString(this.state.searchQuery)) {
      console.log(JSON.parse(this.state.searchQuery));

      let newFileBody = {
        path: this.state.path,
        activePage: 1,
        sortBy: this.state.sortBy,
        sorting: this.state.sorting,
        searchQuery: JSON.parse(this.state.searchQuery)
      }

      this.loadingRef.current.style.display = "block";
      axios.post('/indexed', newFileBody)
        .then((res) => {
          
          if(res.data.index){
            axios.post('/filedataoffset', newFileBody)
            .then((res) => {
              console.log(res.data);
              this.setState({
                data: res.data,
                searchQuery: this.state.searchQuery,
                activePage: 1,
                active100: 1
              });
              axios.post('/numofrecors', { path: newFileBody.path, searchQuery: newFileBody.searchQuery })
                .then((res) => {
                  console.log(res.data)
                  this.setState({ fileLines: res.data });
                  this.loadingRef.current.style.display = "none";
                })
                .catch((err) => {
                  console.log(err);
                })
              this.loadingRef.current.style.display = "none";
            })
            .catch((err) => {
              console.log(err);
            })
          } else {
            console.log("USAO!")
            alert("Field isn't indexed!")
            // this.setState({searchQuery : null})
            this.loadingRef.current.style.display = "none";
          }
        })
        .catch((err) => {
          console.log(err)
        })
      

    } else {
      alert("This isn't JSON object!");
    }
  }
  enterPress(e) {
    if (e.keyCode === 13) {
      // console.log(e.target.value);
      this.findQuery();
    }
  }
  IsJsonString(str) {
    try {
      JSON.parse(str);
    } catch (e) {
      return false;
    }
    return true;
  }

  resetClick() {
    let newFileBody = {
      path: this.state.path,
      activePage: 1,
      sortBy: '_id',
      sorting: 'asc',
      searchQuery: null
    }

    this.loadingRef.current.style.display = "block";
    axios.post('/filedataoffset', newFileBody)
      .then((res) => {

        //
        axios.post('/numofrecors', { path: this.state.path })
          .then((result) => {

            // this.setState({fileLines: result.data});
            this.setState({
              data: res.data,
              activePage: 1,
              active100: 1,
              sortBy: '_id',
              sorting: 'asc',
              searchQuery: null,
              fileLines: result.data,
              arrayOfObjPropsHeadline: this.state.arrayOfObjProps
            });
            this.findRef.current.value = '';
            this.loadingRef.current.style.display = "none";
          })
          .catch((err) => {
            console.log(err);
          })
        //

      })
      .catch((err) => {
        console.log(err);
      })
  }

  render() {
    let styleT = { display: "block" };
    if (!this.props.showing)
      styleT = { display: "none" };

    const arr = this.state.data;
    const currPage = this.state.activePage;
    const perPage = this.state.perPage;

    let indeOfLast = currPage * perPage - (this.state.active100 - 1) * 100;
    let indexOfFirst = indeOfLast - perPage;
    if(indeOfLast > 100) {
      indeOfLast -= 100;
      indexOfFirst -= 100;
    }
    
    console.log(indexOfFirst + " " + indeOfLast);
    const subArr = arr.slice(indexOfFirst, indeOfLast);
    return (
      <div>

        <div className="Table" style={styleT} >
          <div ref={this.loadingRef} className="loader"></div>
          <button className="btn btn-primary btn-lg" onClick={this.handleDivClick}>Back</button>
          <br />
          <label>
            Select number of rows:
              <select value={this.state.perPage} onChange={this.handlePerPageChange}>
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={25}>25</option>
            </select>
          </label>
          <button onClick={this.resetClick} className="btn btn-lg btn-danger reset-btn">Reset</button>
          <div className="form-inline pull-right findIput">
            find(<strong><input ref={this.findRef} onChange={this.handleFindChange} onKeyDown={this.enterPress} className="form-control input-font-size" /></strong>)
            <button onClick={this.findQuery} className="btn btn-lg">Find</button>
          </div>
          <table className="table table-bordered table-style table-hover">
            <tbody><tr>{this.state.arrayOfObjPropsHeadline.map((e, i) => {
              return (
                <th onClick={(e) => this.onClickSort(e, i)} key={i}>{e}</th>
              )
            })}</tr>
              {subArr.map((e) => {
                return (
                  <ObjElements obj={e} arr={this.state.arrayOfObjProps} key={Math.random().toString(36).substr(2, 9)} />
                )
              })}

            </tbody>
          </table>
          <div className="Pagination">
            <Pagination
              activePage={this.state.activePage}
              itemsCountPerPage={this.state.perPage}
              totalItemsCount={this.state.fileLines}
              onChange={this.handlePageChange}

            />
          </div>

        </div>
      </div>
    );
  }
}

Table.propTypes = {
  data: PropTypes.object.isRequired
}

const mapStateToProps = state => {
  return { data: state.data }
}


export default connect(mapStateToProps, {})(Table);
