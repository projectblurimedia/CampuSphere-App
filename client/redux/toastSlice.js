// redux/toastSlice.js
import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  visible: false,
  type: 'info',
  message: '',
  duration: 3000,
  position: 'top-center'
}

const toastSlice = createSlice({
  name: 'toast',
  initialState,
  reducers: {
    showToast: (state, action) => {
      // This should directly modify the state
      state.visible = true
      state.type = action.payload.type || 'info'
      state.message = action.payload.message
      state.duration = action.payload.duration || 3000
      state.position = action.payload.position || 'top-center'
      
      console.log('Toast reducer - showToast:', JSON.stringify(state))
    },
    hideToast: (state) => {
      state.visible = false
      state.message = ''
      console.log('Toast reducer - hideToast')
    }
  }
})

export const { showToast, hideToast } = toastSlice.actions
export default toastSlice.reducer