import { configureStore } from '@reduxjs/toolkit'
import themeReducer from './themeSlice'
import employeeReducer from './employeeSlice'

export const store = configureStore({
  reducer: {
    theme: themeReducer,
    employee: employeeReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
})