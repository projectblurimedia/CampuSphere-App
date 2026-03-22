import { configureStore } from '@reduxjs/toolkit'
import themeReducer from './themeSlice'
import employeeReducer from './employeeSlice'
import toastReducer from './toastSlice'
import studentsRefreshReducer from './studentsRefreshSlice'
import employeesRefreshReducer from './employeesRefreshSlice'
import cashflowRefreshReducer from './cashflowRefreshSlice'

export const store = configureStore({
  reducer: {
    theme: themeReducer,
    employee: employeeReducer,
    toast: toastReducer,
    studentsRefresh: studentsRefreshReducer,
    employeesRefresh: employeesRefreshReducer,
    cashflowRefresh: cashflowRefreshReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
})