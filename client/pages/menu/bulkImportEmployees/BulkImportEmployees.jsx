import React, { useState, useCallback, useMemo } from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Dimensions,
  ActivityIndicator,
  Modal,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { ThemedText } from '@/components/ui/themed-text'
import { FontAwesome5, Feather } from '@expo/vector-icons'
import { useTheme } from '@/hooks/useTheme'
import { ToastNotification } from '@/components/ui/ToastNotification'
import axiosApi from '@/utils/axiosApi'
import * as DocumentPicker from 'expo-document-picker'

export default function BulkImportEmployees({ visible, onClose }) {
  const { colors } = useTheme()
  
  const [excelFile, setExcelFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [importResult, setImportResult] = useState(null)
  const [toast, setToast] = useState(null)

  const showToast = useCallback((message, type = 'error') => {
    setToast({ message, type })
  }, [])

  const hideToast = useCallback(() => {
    setToast(null)
  }, [])

  const handleFilePick = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-excel',
          '.xlsx',
          '.xls'
        ],
        copyToCacheDirectory: true,
      })
      
      if (!result.canceled && result.assets && result.assets[0]) {
        const file = result.assets[0]
        
        const validExtensions = ['.xlsx', '.xls']
        const fileExtension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'))
        
        if (!validExtensions.includes(fileExtension)) {
          showToast('Please select an Excel file (.xlsx or .xls)', 'error')
          return
        }
        
        if (file.size > 10 * 1024 * 1024) {
          showToast('File size must be less than 10MB', 'error')
          return
        }
        
        setExcelFile(file)
        setImportResult(null)
      }
    } catch (error) {
      console.error('File pick error:', error)
      showToast('Failed to pick file', 'error')
    }
  }, [showToast])

  const downloadTemplate = useCallback(async () => {
    try {
      setLoading(true)
      const response = await axiosApi.get('/employees/download-template', {
        responseType: 'blob'
      })
      
      // Create blob from response
      const blob = new Blob([response.data], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      })
      
      // Create download link
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'employees_bulk_import_template.xlsx'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      showToast('Template downloaded successfully', 'success')
    } catch (error) {
      console.error('Download error:', error)
      showToast('Failed to download template. Please try again.', 'error')
    } finally {
      setLoading(false)
    }
  }, [showToast])

  const handleImport = useCallback(async () => {
    if (!excelFile) {
      showToast('Please select an Excel file first', 'error')
      return
    }

    setLoading(true)
    setUploadProgress(0)
    setImportResult(null)
    
    try {
      // Get the actual file URI (different for iOS/Android)
      let fileUri = excelFile.uri;
      
      // For iOS, we might need to add file:// prefix
      if (Platform.OS === 'ios' && !fileUri.startsWith('file://')) {
        fileUri = `file://${fileUri}`;
      }
      
      // Create form data correctly
      const formData = new FormData();
      
      // Get the filename without path
      const fileName = excelFile.name || `employees_${Date.now()}.xlsx`;
      
      // Append the file - CORRECT WAY
      formData.append('excelFile', {
        uri: fileUri,
        name: fileName,
        type: excelFile.mimeType || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      console.log('Uploading file:', fileName, fileUri); 

      const response = await axiosApi.post('/employees/bulk-import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          )
          setUploadProgress(percentCompleted)
        },
      })

      if (response.data.success) {
        const summary = response.data.summary || {
          total: 0,
          success: 0,
          failed: 0,
          skipped: 0
        };
        
        // Get errors from response
        const errors = response.data.summary?.errors || [];
        
        setImportResult({
          total: summary.total,
          success: summary.success,
          failed: summary.failed,
          skipped: summary.skipped || 0,
          errors: errors,
          results: response.data.results || []
        })
        
        // Show appropriate toast based on results
        if (summary.failed === 0 && summary.success > 0) {
          showToast(`✅ Successfully imported ${summary.success} employees`, 'success')
        } else if (summary.success === 0 && summary.failed > 0) {
          showToast(`❌ Import failed: ${summary.failed} errors`, 'error')
        } else if (summary.success > 0 && summary.failed > 0) {
          showToast(`⚠️ Imported ${summary.success}, failed ${summary.failed}`, 'warning')
        }
      }
    } catch (error) {
      console.error('Import error details:', error);
      console.error('Error response:', error.response?.data);
      
      let errorMessage = 'Failed to import employees';
      let errorDetails = [];
      
      if (error.response) {
        // Check if it's a validation error from multer
        if (error.response.status === 400 && error.response.data?.message) {
          errorMessage = error.response.data.message;
          
          // Create a structured error
          errorDetails = [{
            row: 0,
            employeeId: 'N/A',
            error: errorMessage,
            type: 'server_error'
          }];
        } 
        // Check if it's a bulk import error with details
        else if (error.response.data?.summary?.errors) {
          errorDetails = error.response.data.summary.errors;
          errorMessage = error.response.data.message || 'Bulk import failed';
        }
        // Generic error response
        else if (error.response.data?.message) {
          errorMessage = error.response.data.message;
          errorDetails = [{
            row: 0,
            employeeId: 'N/A',
            error: errorMessage,
            type: 'server_error'
          }];
        }
        
        // Set import result with error information
        setImportResult({
          total: 0,
          success: 0,
          failed: errorDetails.length || 1,
          skipped: 0,
          errors: errorDetails,
          results: []
        });
      } else if (error.request) {
        errorMessage = 'No response from server. Check your internet connection.';
        setImportResult({
          total: 0,
          success: 0,
          failed: 1,
          skipped: 0,
          errors: [{
            row: 0,
            employeeId: 'N/A',
            error: errorMessage,
            type: 'connection_error'
          }]
        });
      } else {
        errorMessage = error.message || 'Failed to import employees';
        setImportResult({
          total: 0,
          success: 0,
          failed: 1,
          skipped: 0,
          errors: [{
            row: 0,
            employeeId: 'N/A',
            error: errorMessage,
            type: 'unknown_error'
          }]
        });
      }
      
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  }, [excelFile, showToast])

  const resetImport = useCallback(() => {
    setExcelFile(null)
    setImportResult(null)
    setUploadProgress(0)
  }, [])

  const handleClose = useCallback(() => {
    if (!loading) {
      resetImport()
      onClose()
    }
  }, [loading, resetImport, onClose])

  // Helper function to get error icon based on error type
  const getErrorIcon = (errorType) => {
    switch(errorType) {
      case 'missing_fields':
        return 'alert-circle';
      case 'duplicate':
        return 'copy';
      case 'invalid_email':
        return 'mail';
      case 'invalid_phone':
        return 'phone';
      case 'invalid_aadhar':
        return 'credit-card';
      case 'invalid_designation':
        return 'briefcase';
      default:
        return 'x-circle';
    }
  }

  // Helper function to get error color based on type
  const getErrorColor = (errorType) => {
    switch(errorType) {
      case 'missing_fields':
        return '#f59e0b'; // Orange
      case 'duplicate':
        return '#ef4444'; // Red
      case 'invalid_email':
        return '#f97316'; // Orange-red
      case 'invalid_phone':
        return '#f97316'; // Orange-red
      case 'invalid_aadhar':
        return '#f97316'; // Orange-red
      case 'invalid_designation':
        return '#f97316'; // Orange-red
      default:
        return '#dc2626'; // Dark red
    }
  }

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      paddingTop: Platform.OS === 'ios' ? 70 : 50,
      paddingBottom: 16,
      paddingHorizontal: 20,
      borderBottomLeftRadius: 24,
      borderBottomRightRadius: 24,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    backButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.18)',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.4)',
    },
    title: {
      fontSize: 18,
      color: '#FFFFFF',
      marginBottom: -5,
    },
    subtitle: {
      marginTop: 4,
      fontSize: 11,
      color: 'rgba(255,255,255,0.9)',
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      padding: 16,
      paddingBottom: 100,
    },
    card: {
      borderRadius: 18,
      padding: 20,
      backgroundColor: colors.cardBackground,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 16,
    },
    stepCard: {
      borderRadius: 12,
      padding: 16,
      backgroundColor: colors.inputBackground,
      borderWidth: 1,
      borderColor: colors.primary + '30',
      marginBottom: 12,
    },
    stepHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 10,
    },
    stepNumber: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    stepNumberText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: 'bold',
    },
    stepTitle: {
      fontSize: 16,
      color: colors.primary,
    },
    stepDescription: {
      fontSize: 13,
      color: colors.textSecondary,
      lineHeight: 18,
    },
    excelFormatInfo: {
      fontSize: 12,
      color: colors.textSecondary,
      fontStyle: 'italic',
      marginTop: 8,
    },
    filePickerButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.inputBackground,
      borderWidth: 2,
      borderStyle: 'dashed',
      borderColor: colors.primary + '50',
      borderRadius: 12,
      padding: 20,
      marginTop: 12,
    },
    filePickerButtonSelected: {
      backgroundColor: colors.primary + '10',
      borderStyle: 'solid',
      borderColor: colors.primary,
    },
    filePickerIcon: {
      marginRight: 10,
    },
    filePickerText: {
      fontSize: 15,
      color: colors.primary,
    },
    selectedFileContainer: {
      backgroundColor: colors.inputBackground,
      borderRadius: 12,
      padding: 16,
      marginTop: 12,
      borderWidth: 1,
      borderColor: colors.primary + '30',
    },
    selectedFileRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    fileInfo: {
      flex: 1,
      marginLeft: 12,
    },
    fileName: {
      fontSize: 14,
      color: colors.text,
      marginBottom: 2,
    },
    fileSize: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    removeButton: {
      padding: 6,
    },
    progressBarContainer: {
      height: 6,
      backgroundColor: colors.border,
      borderRadius: 3,
      marginTop: 16,
      overflow: 'hidden',
    },
    progressBarFill: {
      height: '100%',
      backgroundColor: colors.primary,
      borderRadius: 3,
    },
    resultCard: {
      borderRadius: 12,
      padding: 16,
      backgroundColor: colors.inputBackground,
      borderWidth: 1,
      borderColor: importResult?.failed > 0 ? 
        (importResult?.success === 0 ? '#ef4444' : '#f59e0b') : 
        '#10b981',
      marginTop: 16,
    },
    resultHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    resultIcon: {
      marginRight: 10,
    },
    resultTitle: {
      fontSize: 16,
      color: importResult?.failed > 0 ? 
        (importResult?.success === 0 ? '#ef4444' : '#f59e0b') : 
        '#10b981',
      fontWeight: 'bold',
    },
    resultStats: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginBottom: 12,
      flexWrap: 'wrap',
    },
    statItem: {
      alignItems: 'center',
      minWidth: 70,
    },
    statValue: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 2,
    },
    statLabel: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    errorSection: {
      marginTop: 12,
    },
    errorTitle: {
      fontSize: 14,
      color: colors.text,
      marginBottom: 8,
      fontWeight: 'bold',
    },
    errorItem: {
      backgroundColor: '#fef2f2',
      borderRadius: 8,
      padding: 12,
      marginBottom: 8,
      borderLeftWidth: 4,
      borderLeftColor: '#ef4444',
    },
    errorRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    errorIcon: {
      marginRight: 10,
      marginTop: 2,
    },
    errorContent: {
      flex: 1,
    },
    errorEmployeeId: {
      fontSize: 13,
      fontWeight: 'bold',
      color: '#374151',
      marginBottom: 2,
    },
    errorText: {
      fontSize: 13,
      color: '#4B5563',
      lineHeight: 18,
    },
    errorRowNumber: {
      fontSize: 11,
      color: '#9CA3AF',
      marginTop: 4,
    },
    errorChip: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 12,
      alignSelf: 'flex-start',
      marginTop: 4,
    },
    errorChipText: {
      fontSize: 10,
    },
    footerWrapper: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      paddingHorizontal: 16,
      paddingBottom: Platform.OS === 'ios' ? 24 : 16,
      paddingTop: 8,
      backgroundColor: colors.background,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    buttonRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 12,
    },
    buttonCard: {
      borderRadius: 16,
      overflow: 'hidden',
      flex: 1,
    },
    secondaryButton: {
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.inputBackground,
      paddingVertical: 13,
      paddingHorizontal: 18,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    secondaryButtonText: {
      color: colors.text,
      fontSize: 15,
    },
    importButtonGradient: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    importButtonPressable: {
      flex: 1,
      paddingVertical: 13,
      paddingHorizontal: 18,
      width: '100%',
      height: '100%',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    importButtonText: {
      color: '#FFFFFF',
      fontSize: 15,
      marginLeft: 8,
    },
    disabledButton: {
      opacity: 0.5,
    },
    successRow: {
      backgroundColor: '#f0fdf4',
      borderRadius: 6,
      padding: 8,
      marginBottom: 4,
    },
    successText: {
      color: '#166534',
      fontSize: 12,
    },
  }), [colors, importResult])

  // Check if import button should be enabled
  const isImportEnabled = useMemo(() => {
    return excelFile !== null && !loading;
  }, [excelFile, loading]);

  return (
    <Modal visible={visible} animationType="fade" onRequestClose={handleClose} statusBarTranslucent>
      <View style={styles.container}>
        <LinearGradient
          colors={[colors.gradientStart, colors.gradientEnd]}
          style={styles.header}
        >
          <SafeAreaView edges={['top']}>
            <View style={styles.headerRow}>
              <TouchableOpacity 
                style={[styles.backButton, loading && { opacity: 0.5 }]} 
                onPress={handleClose}
                disabled={loading}
              >
                <FontAwesome5 style={{ marginLeft: -2 }} name="chevron-left" size={20} color="#FFFFFF" />
              </TouchableOpacity>
              <View style={{ flex: 1, alignItems: 'center' }}>
                <ThemedText type='subtitle' style={styles.title}>Bulk Import Employees</ThemedText>
                <ThemedText style={styles.subtitle}>Upload Excel file with employee data</ThemedText>
              </View>
              <View style={{ width: 44 }} />
            </View>
          </SafeAreaView>
        </LinearGradient>

        <ScrollView 
          style={styles.scrollView} 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            <View style={styles.stepCard}>
              <View style={styles.stepHeader}>
                <View style={styles.stepNumber}>
                  <ThemedText style={styles.stepNumberText}>1</ThemedText>
                </View>
                <ThemedText type='subtitle' style={styles.stepTitle}>Download Excel Template</ThemedText>
              </View>
              <ThemedText style={styles.stepDescription}>
                Download our Excel template to ensure correct formatting. Fill in employee data following the provided format.
              </ThemedText>
              <TouchableOpacity 
                style={[styles.filePickerButton, { marginTop: 8 }]}
                onPress={downloadTemplate}
                disabled={loading}
              >
                <Feather name="download" size={20} color={colors.primary} style={styles.filePickerIcon} />
                <ThemedText style={styles.filePickerText}>
                  {loading ? 'Downloading...' : 'Download Template'}
                </ThemedText>
              </TouchableOpacity>
            </View>

            <View style={styles.stepCard}>
              <View style={styles.stepHeader}>
                <View style={styles.stepNumber}>
                  <ThemedText style={styles.stepNumberText}>2</ThemedText>
                </View>
                <ThemedText type='subtitle' style={styles.stepTitle}>Prepare Your Excel File</ThemedText>
              </View>
              <ThemedText style={styles.stepDescription}>
                Fill the Excel template with employee data. Required columns: firstName, lastName, gender, dob, email, phone, address, village, designation, joiningDate, qualification, aadharNumber, panNumber
              </ThemedText>
              <ThemedText style={styles.excelFormatInfo}>
                Format: Excel (.xlsx or .xls), max 10MB file size. First row should contain headers.
              </ThemedText>
            </View>

            <View style={styles.stepCard}>
              <View style={styles.stepHeader}>
                <View style={styles.stepNumber}>
                  <ThemedText style={styles.stepNumberText}>3</ThemedText>
                </View>
                <ThemedText type='subtitle' style={styles.stepTitle}>Select Excel File</ThemedText>
              </View>
              <ThemedText style={styles.stepDescription}>
                Choose the Excel file you've prepared with employee data. File must be less than 10MB.
              </ThemedText>
              
              <TouchableOpacity 
                style={[
                  styles.filePickerButton,
                  excelFile && styles.filePickerButtonSelected
                ]}
                onPress={handleFilePick}
                disabled={loading}
              >
                <Feather name="upload" size={20} color={colors.primary} style={styles.filePickerIcon} />
                <ThemedText style={styles.filePickerText}>
                  {excelFile ? 'Change Excel File' : 'Select Excel File'}
                </ThemedText>
              </TouchableOpacity>
              
              {excelFile && (
                <View style={styles.selectedFileContainer}>
                  <View style={styles.selectedFileRow}>
                    <Feather name="file" size={24} color={colors.primary} />
                    <View style={styles.fileInfo}>
                      <ThemedText style={styles.fileName}>{excelFile.name}</ThemedText>
                      <ThemedText style={styles.fileSize}>
                        {(excelFile.size / 1024).toFixed(2)} KB
                      </ThemedText>
                    </View>
                    <TouchableOpacity 
                      style={styles.removeButton}
                      onPress={() => setExcelFile(null)}
                      disabled={loading}
                    >
                      <Feather name="x" size={20} color={colors.textSecondary} />
                    </TouchableOpacity>
                  </View>
                  
                  {loading && uploadProgress > 0 && (
                    <View style={styles.progressBarContainer}>
                      <View 
                        style={[
                          styles.progressBarFill,
                          { width: `${uploadProgress}%` }
                        ]} 
                      />
                    </View>
                  )}
                </View>
              )}
            </View>

            {importResult && (
              <View style={styles.resultCard}>
                <View style={styles.resultHeader}>
                  <Feather 
                    name={importResult.failed > 0 ? 
                      (importResult.success === 0 ? "x-circle" : "alert-triangle") : 
                      "check-circle"} 
                    size={24} 
                    color={importResult.failed > 0 ? 
                      (importResult.success === 0 ? '#ef4444' : '#f59e0b') : 
                      '#10b981'} 
                    style={styles.resultIcon}
                  />
                  <ThemedText style={styles.resultTitle}>
                    {importResult.failed > 0 ? 
                      (importResult.success === 0 ? 'Import Failed' : 'Import Completed with Errors') : 
                      'Import Successful'}
                  </ThemedText>
                </View>
                
                <View style={styles.resultStats}>
                  <View style={styles.statItem}>
                    <ThemedText style={styles.statValue}>{importResult.total}</ThemedText>
                    <ThemedText style={styles.statLabel}>Total</ThemedText>
                  </View>
                  <View style={styles.statItem}>
                    <ThemedText style={[styles.statValue, { color: '#10b981' }]}>
                      {importResult.success}
                    </ThemedText>
                    <ThemedText style={styles.statLabel}>Success</ThemedText>
                  </View>
                  <View style={styles.statItem}>
                    <ThemedText style={[styles.statValue, { color: '#ef4444' }]}>
                      {importResult.failed}
                    </ThemedText>
                    <ThemedText style={styles.statLabel}>Failed</ThemedText>
                  </View>
                  {importResult.skipped > 0 && (
                    <View style={styles.statItem}>
                      <ThemedText style={[styles.statValue, { color: '#9ca3af' }]}>
                        {importResult.skipped}
                      </ThemedText>
                      <ThemedText style={styles.statLabel}>Skipped</ThemedText>
                    </View>
                  )}
                </View>
                
                {importResult.errors && importResult.errors.length > 0 && (
                  <View style={styles.errorSection}>
                    <ThemedText style={styles.errorTitle}>
                      Error Details ({importResult.errors.length}):
                    </ThemedText>
                    {importResult.errors.slice(0, 10).map((error, index) => (
                      <View key={index} style={styles.errorItem}>
                        <View style={styles.errorRow}>
                          <Feather 
                            name={getErrorIcon(error.type)} 
                            size={16} 
                            color={getErrorColor(error.type)} 
                            style={styles.errorIcon}
                          />
                          <View style={styles.errorContent}>
                            {error.email && error.email !== 'N/A' && (
                              <ThemedText style={styles.errorEmployeeId}>
                                Email: {error.email}
                              </ThemedText>
                            )}
                            <ThemedText style={styles.errorText}>
                              {error.error}
                            </ThemedText>
                            {error.row > 0 && (
                              <ThemedText style={styles.errorRowNumber}>
                                Row {error.row}
                              </ThemedText>
                            )}
                          </View>
                        </View>
                        
                        {/* Show error type chip for common errors */}
                        {error.error.includes('Missing required fields') && (
                          <View style={[styles.errorChip, { backgroundColor: '#fff3cd' }]}>
                            <ThemedText style={[styles.errorChipText, { color: '#856404' }]}>
                              Missing Fields
                            </ThemedText>
                          </View>
                        )}
                        {error.error.includes('Duplicate') && (
                          <View style={[styles.errorChip, { backgroundColor: '#f8d7da' }]}>
                            <ThemedText style={[styles.errorChipText, { color: '#721c24' }]}>
                              Duplicate
                            </ThemedText>
                          </View>
                        )}
                        {error.error.includes('Invalid email') && (
                          <View style={[styles.errorChip, { backgroundColor: '#fff3cd' }]}>
                            <ThemedText style={[styles.errorChipText, { color: '#856404' }]}>
                              Invalid Email
                            </ThemedText>
                          </View>
                        )}
                        {error.error.includes('Invalid phone') && (
                          <View style={[styles.errorChip, { backgroundColor: '#fff3cd' }]}>
                            <ThemedText style={[styles.errorChipText, { color: '#856404' }]}>
                              Invalid Phone
                            </ThemedText>
                          </View>
                        )}
                        {error.error.includes('Invalid Aadhar') && (
                          <View style={[styles.errorChip, { backgroundColor: '#fff3cd' }]}>
                            <ThemedText style={[styles.errorChipText, { color: '#856404' }]}>
                              Invalid Aadhar
                            </ThemedText>
                          </View>
                        )}
                        {error.error.includes('Invalid designation') && (
                          <View style={[styles.errorChip, { backgroundColor: '#fff3cd' }]}>
                            <ThemedText style={[styles.errorChipText, { color: '#856404' }]}>
                              Invalid Designation
                            </ThemedText>
                          </View>
                        )}
                      </View>
                    ))}
                    
                    {importResult.errors.length > 10 && (
                      <ThemedText style={{ color: colors.textSecondary, fontSize: 12, marginTop: 8, textAlign: 'center' }}>
                        + {importResult.errors.length - 10} more errors. Fix these and try again.
                      </ThemedText>
                    )}
                  </View>
                )}

                {/* Show success results if available */}
                {importResult.results && importResult.results.length > 0 && (
                  <View style={[styles.errorSection, { marginTop: 16 }]}>
                    <ThemedText style={[styles.errorTitle, { color: '#10b981' }]}>
                      Successfully Imported ({importResult.results.length}):
                    </ThemedText>
                    {importResult.results.slice(0, 5).map((result, index) => (
                      <View key={index} style={[styles.successRow]}>
                        <ThemedText style={styles.successText}>
                          {result.email || result.employeeId} - {result.name}
                        </ThemedText>
                      </View>
                    ))}
                    {importResult.results.length > 5 && (
                      <ThemedText style={{ color: colors.textSecondary, fontSize: 12, marginTop: 4 }}>
                        + {importResult.results.length - 5} more employees imported
                      </ThemedText>
                    )}
                  </View>
                )}
              </View>
            )}
          </View>
        </ScrollView>

        <View style={styles.footerWrapper}>
          <View style={styles.buttonRow}>
            <TouchableOpacity 
              style={[styles.secondaryButton, loading && styles.disabledButton]}
              onPress={resetImport}
              disabled={loading}
            >
              <ThemedText style={styles.secondaryButtonText}>Reset</ThemedText>
            </TouchableOpacity>
            
            <View style={styles.buttonCard}>
              <LinearGradient
                colors={!isImportEnabled ? [colors.border, colors.border] : [colors.gradientStart, colors.gradientEnd]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.importButtonGradient}
              >
                <TouchableOpacity
                  onPress={handleImport}
                  activeOpacity={0.9}
                  style={[
                    styles.importButtonPressable, 
                    (!isImportEnabled) && styles.disabledButton
                  ]}
                  disabled={!isImportEnabled}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Feather name="upload-cloud" size={18} color="#FFFFFF" />
                  )}
                  <ThemedText style={styles.importButtonText}>
                    {loading ? 'Importing...' : 'Start Import'}
                  </ThemedText>
                </TouchableOpacity>
              </LinearGradient>
            </View>
          </View>
        </View>

        <ToastNotification
          visible={!!toast}
          type={toast?.type}
          message={toast?.message}
          onHide={hideToast}
          position="bottom-center"
          duration={3000}
          showCloseButton={true}
        />
      </View>
    </Modal>
  )
}