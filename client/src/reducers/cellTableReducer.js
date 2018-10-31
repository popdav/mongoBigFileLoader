import { SEND_DATA } from '../actions/types';

const initialState = {
    data:{}
}

export default function(state = initialState, action) {
    switch(action.type) {
        case SEND_DATA:
            return {
                ...state,
                data: action.payload
            }
        default:
            return initialState
    }
}