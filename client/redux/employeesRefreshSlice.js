import { createSlice } from '@reduxjs/toolkit'

const employeesRefreshSlice = createSlice({
  name: 'employeesRefresh',
  initialState: {
    refreshTrigger: 0,
  },
  reducers: {
    triggerRefresh: (state) => {
      state.refreshTrigger += 1
    },
  },
})

export const { triggerRefresh } = employeesRefreshSlice.actions
export default employeesRefreshSlice.reducer