import React, { useState, useEffect } from 'react'
import { View, ActivityIndicator, Modal, StyleSheet } from 'react-native'

const componentMap = {
  'schoolProfile': () => import('@/pages/menu/schoolProfile/SchoolProfile'),
  'schoolStats': () => import('@/pages/menu/schoolStats/SchoolStats'),
  'events': () => import('@/pages/menu/events/Events'),
  'createStudent': () => import('@/pages/menu/createStudent/CreateStudent'),
  'createEmployee': () => import('@/pages/menu/createEmployee/CreateEmployee'),
  'attendance': () => import('@/pages/menu/attendance/Attendance'),
  'bulkImportStudents': () => import('@/pages/menu/bulkImportStudents/BulkImportStudents'),
  'bulkImportEmployees': () => import('@/pages/menu/bulkImportEmployees/BulkImportEmployees'),
  'uploadMarks': () => import('@/pages/menu/uploadMarks/UploadMarks'),
  'feeManagement': () => import('@/pages/menu/feeManagement/FeeManagement'),
  'feeDetails': () => import('@/pages/menu/feeDetails/FeeDetails'),
}

export default function Dashboard({ 
  visible, 
  onClose, 
  componentName 
}) {
  const [Component, setComponent] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (visible && componentName && !Component) {
      setLoading(true)
      
      const importComponent = componentMap[componentName]
      if (!importComponent) {
        console.error(`Component ${componentName} not found in componentMap`)
        setLoading(false)
        return
      }

      importComponent()
        .then(module => {
          setComponent(() => module.default)
          setLoading(false)
        })
        .catch(err => {
          console.error('Failed to load component:', err)
          setLoading(false)
          onClose?.()
        })
    }

    // Cleanup when modal closes
    if (!visible) {
      const timer = setTimeout(() => {
        setComponent(null)
        setLoading(false)
      }, 300) // Delay cleanup to allow smooth animations
      
      return () => clearTimeout(timer)
    }
  }, [visible, componentName])

  if (!visible) return null

  if (loading) {
    return (
      <Modal
        visible={true}
        transparent={true}
        animationType="fade"
        statusBarTranslucent
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFFFFF" />
        </View>
      </Modal>
    )
  }

  if (Component) {
    return <Component visible={visible} onClose={onClose} />
  }

  return null
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
})