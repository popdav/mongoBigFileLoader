import { SEND_DATA } from './types';

export const cellToTableTransfer = (data) => dispatch => {
    dispatch({
        type: SEND_DATA,
        payload: data
    })
}