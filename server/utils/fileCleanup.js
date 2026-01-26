const fs = require('fs')
const path = require('path')

const cleanupTempFiles = (file) => {
  if (!file || !file.path) return
  
  try {
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path)
    }
  } catch (error) {
    console.error('Error cleaning up temp file:', error)
  }
}

module.exports = { cleanupTempFiles }