import { createSlice } from '@reduxjs/toolkit'

const studentsRefreshSlice = createSlice({
  name: 'studentsRefresh',
  initialState: {
    refreshTrigger: 0,
  },
  reducers: {
    triggerRefresh: (state) => {
      state.refreshTrigger += 1
    },
  },
})

export const { triggerRefresh } = studentsRefreshSlice.actions
export default studentsRefreshSlice.reducer