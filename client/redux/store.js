import { configureStore } from '@reduxjs/toolkit'
import themeReducer from './themeSlice'
import employeeReducer from './employeeSlice'
import toastReducer from './toastSlice'

export const store = configureStore({
  reducer: {
    theme: themeReducer,
    employee: employeeReducer,
    toast: toastReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
})