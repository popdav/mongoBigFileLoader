import { combineReducers } from 'redux';
import cellTableReducer from './cellTableReducer';

export default combineReducers({
    data: cellTableReducer
});