import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axiosApi from '@/utils/axiosApi'
import AsyncStorage from '@react-native-async-storage/async-storage'

// Async thunks for API calls
export const checkEmployeeExists = createAsyncThunk(
  'employee/checkExists',
  async (emailOrPhone, { rejectWithValue }) => {
    try {
      const response = await axiosApi.post('/auth/check-user', { emailOrPhone })
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message })
    }
  }
)

export const loginEmployee = createAsyncThunk(
  'employee/login',
  async ({ employeeId, password }, { rejectWithValue }) => {
    try {
      const response = await axiosApi.post('/auth/login', { employeeId, password })
      
      if (response.data.success && response.data.data?.token) {
        await AsyncStorage.setItem('auth_token', response.data.data.token)
        await AsyncStorage.setItem('employee_data', JSON.stringify(response.data.data.employee))
      }
      
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message })
    }
  }
)

export const createEmployeePassword = createAsyncThunk(
  'employee/createPassword',
  async ({ employeeId, password, confirmPassword }, { rejectWithValue }) => {
    try {
      const response = await axiosApi.post('/auth/create-password', {
        employeeId,
        password,
        confirmPassword
      })
      
      if (response.data.success && response.data.data?.token) {
        await AsyncStorage.setItem('auth_token', response.data.data.token)
        await AsyncStorage.setItem('employee_data', JSON.stringify(response.data.data.employee))
      }
      
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message })
    }
  }
)

export const logoutEmployee = createAsyncThunk(
  'employee/logout',
  async (_, { rejectWithValue }) => {
    try {
      await AsyncStorage.removeItem('auth_token')
      await AsyncStorage.removeItem('employee_data')
      return { success: true }
    } catch (error) {
      return rejectWithValue({ message: error.message })
    }
  }
)

export const loadEmployeeFromStorage = createAsyncThunk(
  'employee/loadFromStorage',
  async (_, { rejectWithValue }) => {
    try {
      const token = await AsyncStorage.getItem('auth_token')
      const employeeData = await AsyncStorage.getItem('employee_data')
      
      if (token && employeeData) {
        const employee = JSON.parse(employeeData)
        return {
          token,
          employee,
          isAuthenticated: true
        }
      }
      
      return { token: null, employee: null, isAuthenticated: false }
    } catch (error) {
      return rejectWithValue({ message: error.message })
    }
  }
)

const employeeSlice = createSlice({
  name: 'employee',
  initialState: {
    employee: null,
    token: null,
    isLoading: true, // Start with true for initial load
    isAuthenticated: false,
    error: null,
    currentStep: 'emailPhone',
    tempEmployee: null,
  },
  reducers: {
    setCurrentStep: (state, action) => {
      state.currentStep = action.payload
    },
    setTempEmployee: (state, action) => {
      state.tempEmployee = action.payload
    },
    clearError: (state) => {
      state.error = null
    },
    resetLoginFlow: (state) => {
      state.currentStep = 'emailPhone'
      state.tempEmployee = null
      state.error = null
    },
    setEmployee: (state, action) => {
      state.employee = action.payload
      state.isAuthenticated = true
      state.isLoading = false
    },
    clearEmployee: (state) => {
      state.employee = null
      state.token = null
      state.isAuthenticated = false
      state.currentStep = 'emailPhone'
      state.tempEmployee = null
      state.isLoading = false
    },
  },
  extraReducers: (builder) => {
    builder
      // Load from Storage (Initial)
      .addCase(loadEmployeeFromStorage.pending, (state) => {
        state.isLoading = true
      })
      .addCase(loadEmployeeFromStorage.fulfilled, (state, action) => {
        state.isLoading = false
        state.employee = action.payload.employee
        state.token = action.payload.token
        state.isAuthenticated = action.payload.isAuthenticated
      })
      .addCase(loadEmployeeFromStorage.rejected, (state) => {
        state.isLoading = false
        state.employee = null
        state.token = null
        state.isAuthenticated = false
      })
      
      // Check Employee Exists
      .addCase(checkEmployeeExists.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(checkEmployeeExists.fulfilled, (state, action) => {
        state.isLoading = false
        state.tempEmployee = action.payload.data
        state.currentStep = action.payload.data.requiresPasswordSetup 
          ? 'createPassword' 
          : 'password'
      })
      .addCase(checkEmployeeExists.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload?.message || 'Failed to find employee'
      })
      
      // Login Employee
      .addCase(loginEmployee.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(loginEmployee.fulfilled, (state, action) => {
        state.isLoading = false
        state.employee = action.payload.data?.employee || null
        state.token = action.payload.data?.token || null
        state.isAuthenticated = action.payload.success || false
        state.tempEmployee = null
        state.error = null
      })
      .addCase(loginEmployee.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload?.message || 'Login failed'
      })
      
      // Create Password
      .addCase(createEmployeePassword.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(createEmployeePassword.fulfilled, (state, action) => {
        state.isLoading = false
        state.employee = action.payload.data?.employee || null
        state.token = action.payload.data?.token || null
        state.isAuthenticated = action.payload.success || false
        state.tempEmployee = null
        state.currentStep = 'emailPhone'
        state.error = null
      })
      .addCase(createEmployeePassword.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload?.message || 'Password creation failed'
      })
      
      // Logout
      .addCase(logoutEmployee.fulfilled, (state) => {
        state.employee = null
        state.token = null
        state.isAuthenticated = false
        state.currentStep = 'emailPhone'
        state.tempEmployee = null
        state.isLoading = false
        state.error = null
      })
  }
})

export const { 
  setCurrentStep, 
  setTempEmployee, 
  clearError, 
  resetLoginFlow,
  setEmployee,
  clearEmployee
} = employeeSlice.actions

export default employeeSlice.reducer