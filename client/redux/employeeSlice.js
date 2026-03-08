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

// FORGOT PASSWORD THUNKS
export const forgotPassword = createAsyncThunk(
  'employee/forgotPassword',
  async (emailOrPhone, { rejectWithValue }) => {
    try {
      const response = await axiosApi.post('/auth/forgot-password', { emailOrPhone })
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message })
    }
  }
)

export const verifyOTP = createAsyncThunk(
  'employee/verifyOTP',
  async ({ employeeId, otp }, { rejectWithValue }) => {
    try {
      const response = await axiosApi.post('/auth/verify-otp', { employeeId, otp })
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message })
    }
  }
)

export const resetPassword = createAsyncThunk(
  'employee/resetPassword',
  async ({ resetToken, newPassword, confirmPassword }, { rejectWithValue }) => {
    try {
      const response = await axiosApi.post('/auth/reset-password', {
        resetToken,
        newPassword,
        confirmPassword
      })
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
    
    // Forgot password state
    forgotPassword: {
      step: 'email', // email, otp, createPassword
      employeeId: null,
      email: null,
      resetToken: null,
      isLoading: false,
      error: null,
      success: false,
      message: null,
    },
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
    
    // Forgot password reducers
    setForgotPasswordStep: (state, action) => {
      state.forgotPassword.step = action.payload
    },
    resetForgotPassword: (state) => {
      state.forgotPassword = {
        step: 'email',
        employeeId: null,
        email: null,
        resetToken: null,
        isLoading: false,
        error: null,
        success: false,
        message: null,
      }
    },
    clearForgotPasswordError: (state) => {
      state.forgotPassword.error = null
    },
    immediateLogout: (state) => {
      state.employee = null
      state.token = null
      state.isAuthenticated = false
      state.currentStep = 'emailPhone'
      state.tempEmployee = null
      state.error = null
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
      
      // FORGOT PASSWORD CASES
      // Send OTP
      .addCase(forgotPassword.pending, (state) => {
        state.forgotPassword.isLoading = true
        state.forgotPassword.error = null
        state.forgotPassword.message = null
      })
      .addCase(forgotPassword.fulfilled, (state, action) => {
        state.forgotPassword.isLoading = false
        if (action.payload.success) {
          state.forgotPassword.employeeId = action.payload.data?.employeeId
          state.forgotPassword.step = 'otp'
          state.forgotPassword.message = action.payload.data?.message || 'OTP sent successfully'
        } else {
          state.forgotPassword.error = action.payload?.message || 'Failed to send OTP'
        }
      })
      .addCase(forgotPassword.rejected, (state, action) => {
        state.forgotPassword.isLoading = false
        state.forgotPassword.error = action.payload?.message || 'Failed to send OTP'
      })
      
      // Verify OTP
      .addCase(verifyOTP.pending, (state) => {
        state.forgotPassword.isLoading = true
        state.forgotPassword.error = null
      })
      .addCase(verifyOTP.fulfilled, (state, action) => {
        state.forgotPassword.isLoading = false
        if (action.payload.success) {
          state.forgotPassword.resetToken = action.payload.data?.resetToken
          state.forgotPassword.step = 'createPassword'
          state.forgotPassword.message = 'OTP verified successfully'
        } else {
          state.forgotPassword.error = action.payload?.message || 'Invalid OTP'
        }
      })
      .addCase(verifyOTP.rejected, (state, action) => {
        state.forgotPassword.isLoading = false
        state.forgotPassword.error = action.payload?.message || 'OTP verification failed'
      })
      
      // Reset Password
      .addCase(resetPassword.pending, (state) => {
        state.forgotPassword.isLoading = true
        state.forgotPassword.error = null
      })
      .addCase(resetPassword.fulfilled, (state, action) => {
        state.forgotPassword.isLoading = false
        if (action.payload.success) {
          state.forgotPassword.success = true
          state.forgotPassword.message = 'Password reset successfully'
        } else {
          state.forgotPassword.error = action.payload?.message || 'Failed to reset password'
        }
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.forgotPassword.isLoading = false
        state.forgotPassword.error = action.payload?.message || 'Password reset failed'
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
  clearEmployee,
  setForgotPasswordStep,
  resetForgotPassword,
  clearForgotPasswordError,
  immediateLogout,
} = employeeSlice.actions

export default employeeSlice.reducer