import { createSlice } from '@reduxjs/toolkit'

const cashflowRefreshSlice = createSlice({
  name: 'cashflowRefresh',
  initialState: {
    refreshTrigger: 0,
  },
  reducers: {
    triggerRefresh: (state) => {
      state.refreshTrigger += 1
    },
  },
})

export const { triggerRefresh } = cashflowRefreshSlice.actions
export default cashflowRefreshSlice.reducer