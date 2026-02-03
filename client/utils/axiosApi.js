import axios from 'axios'

const axiosApi = axios.create({
  baseURL: 'http://192.168.31.232:8080/api', 
  // baseURL: 'https://campusphere-app-backend.onrender.com/server', 
  headers: {
    'Content-Type': 'application/json',
  }
})

export default axiosApi