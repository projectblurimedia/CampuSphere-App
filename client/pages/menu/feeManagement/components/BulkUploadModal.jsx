import React from 'react'
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Dimensions,
  Platform,
} from 'react-native'
import * as DocumentPicker from 'expo-document-picker'
import { ThemedText } from '@/components/ui/themed-text'
import {
  Feather,
  MaterialIcons,
  MaterialCommunityIcons,
} from '@expo/vector-icons'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

const BulkUploadModal = React.memo(({
  visible,
  activeTab,
  colors,
  uploading,
  uploadProgress,
  uploadResult,
  onDownloadTemplate,
  onUpload,
  onClose,
  onRefresh,
}) => {
  const handleFileUpload = async () => {
    try {
      // Pick Excel file
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-excel',
          '.xlsx',
          '.xls'
        ],
        copyToCacheDirectory: true,
      })

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return
      }

      const asset = result.assets[0]
      
      // Validate file
      const validExtensions = ['.xlsx', '.xls']
      const fileExtension = asset.name.toLowerCase().slice(asset.name.lastIndexOf('.'))
      
      if (!validExtensions.includes(fileExtension)) {
        Alert.alert('Invalid File', 'Please select an Excel file (.xlsx or .xls)')
        return
      }
      
      if (asset.size > 10 * 1024 * 1024) {
        Alert.alert('File Too Large', 'File size must be less than 10MB')
        return
      }

      // Get the actual file URI
      let fileUri = asset.uri
      
      // For iOS, we might need to add file:// prefix
      if (Platform.OS === 'ios' && !fileUri.startsWith('file://')) {
        fileUri = `file://${fileUri}`
      }
      
      const file = {
        uri: fileUri,
        name: asset.name,
        mimeType: asset.mimeType || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      }
      
      onUpload(file)
    } catch (error) {
      console.error('Error picking file:', error)
      Alert.alert('Error', 'Failed to pick file. Please try again.')
    }
  }

  const getTabColor = () => {
    switch(activeTab) {
      case 'class': return colors.primary
      case 'bus': return colors.success
      case 'hostel': return colors.warning
      default: return colors.primary
    }
  }

  const getTabName = () => {
    switch(activeTab) {
      case 'class': return 'Class Fees'
      case 'bus': return 'Bus Fees'
      case 'hostel': return 'Hostel Fees'
      default: return 'Class Fees'
    }
  }

  const getRequiredColumns = () => {
    switch(activeTab) {
      case 'class':
        return ['className', 'academicYear', 'totalAnnualFee', 'totalTerms (optional)']
      case 'bus':
        return ['villageName', 'distance', 'feeAmount', 'academicYear', 'vehicleType (optional)']
      case 'hostel':
        return ['hostelName', 'hostelType', 'roomType', 'academicYear', 'feeAmount', 'depositAmount (optional)']
      default:
        return []
    }
  }

  const tabColor = getTabColor()
  const tabName = getTabName()
  const requiredColumns = getRequiredColumns()

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={() => {
        if (!uploading) {
          onClose()
        }
      }}
      statusBarTranslucent={true}
    >
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
          <View style={styles.header}>
            <View style={[styles.iconContainer, { backgroundColor: tabColor + '15' }]}>
              <Feather name="upload" size={24} color={tabColor} />
            </View>
            <View style={styles.titleContainer}>
              <ThemedText type="title" style={[styles.title, { color: colors.text }]}>
                Bulk Upload {tabName}
              </ThemedText>
              <ThemedText style={[styles.subtitle, { color: colors.textSecondary }]}>
                Upload Excel file with {activeTab} fee data
              </ThemedText>
            </View>
            <TouchableOpacity
              onPress={() => {
                if (!uploading) onClose()
              }}
              disabled={uploading}
              style={styles.closeButton}
            >
              <Feather name="x" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Template Download */}
            <View style={[styles.stepCard, { backgroundColor: tabColor + '05', borderColor: tabColor + '20' }]}>
              <View style={styles.stepHeader}>
                <View style={[styles.stepIcon, { backgroundColor: tabColor + '15' }]}>
                  <MaterialCommunityIcons name="file-download" size={20} color={tabColor} />
                </View>
                <View style={styles.stepTextContainer}>
                  <ThemedText type="subtitle" style={[styles.stepTitle, { color: tabColor }]}>
                    Step 1: Download Template
                  </ThemedText>
                  <ThemedText style={[styles.stepDescription, { color: colors.textSecondary }]}>
                    Download the Excel template with correct column structure
                  </ThemedText>
                </View>
              </View>
              
              <TouchableOpacity
                style={[styles.downloadButton, { 
                  backgroundColor: tabColor + '10',
                  borderColor: tabColor
                }]}
                onPress={onDownloadTemplate}
                disabled={uploading}
              >
                <MaterialCommunityIcons name="file-excel" size={20} color={tabColor} />
                <ThemedText style={[styles.downloadButtonText, { color: tabColor }]}>
                  Download Excel Template
                </ThemedText>
              </TouchableOpacity>
              
              <View style={[styles.infoContainer, { backgroundColor: colors.inputBackground }]}>
                <ThemedText type="caption" style={[styles.infoTitle, { color: colors.text }]}>
                  Required Columns:
                </ThemedText>
                <View style={styles.columnsList}>
                  {requiredColumns.map((column, index) => (
                    <View key={index} style={[styles.columnItem, { 
                      backgroundColor: colors.background,
                      borderColor: colors.border
                    }]}>
                      <Feather 
                        name={column.includes('(optional)') ? "circle" : "check"} 
                        size={12} 
                        color={column.includes('(optional)') ? colors.textSecondary : colors.success} 
                      />
                      <ThemedText style={[
                        styles.columnText, 
                        { color: column.includes('(optional)') ? colors.textSecondary : colors.text }
                      ]}>
                        {column}
                      </ThemedText>
                    </View>
                  ))}
                </View>
              </View>
            </View>

            {/* File Upload */}
            <View style={[styles.stepCard, { backgroundColor: tabColor + '05', borderColor: tabColor + '20' }]}>
              <View style={styles.stepHeader}>
                <View style={[styles.stepIcon, { backgroundColor: tabColor + '15' }]}>
                  <Feather name="upload-cloud" size={20} color={tabColor} />
                </View>
                <View style={styles.stepTextContainer}>
                  <ThemedText type="subtitle" style={[styles.stepTitle, { color: tabColor }]}>
                    Step 2: Upload File
                  </ThemedText>
                  <ThemedText style={[styles.stepDescription, { color: colors.textSecondary }]}>
                    Select your prepared Excel file. Existing records will be updated, new ones created.
                  </ThemedText>
                </View>
              </View>
              
              <View style={styles.instructions}>
                <ThemedText type="caption" style={[styles.instructionsTitle, { color: colors.text }]}>
                  File Requirements:
                </ThemedText>
                <View style={styles.instructionsList}>
                  <View style={styles.instructionItem}>
                    <MaterialIcons name="check-circle" size={16} color={colors.success} />
                    <ThemedText style={[styles.instructionText, { color: colors.textSecondary }]}>
                      Excel format (.xlsx or .xls)
                    </ThemedText>
                  </View>
                  <View style={styles.instructionItem}>
                    <MaterialIcons name="check-circle" size={16} color={colors.success} />
                    <ThemedText style={[styles.instructionText, { color: colors.textSecondary }]}>
                      Maximum file size: 10MB
                    </ThemedText>
                  </View>
                  <View style={styles.instructionItem}>
                    <MaterialIcons name="check-circle" size={16} color={colors.success} />
                    <ThemedText style={[styles.instructionText, { color: colors.textSecondary }]}>
                      First row should contain headers
                    </ThemedText>
                  </View>
                </View>
              </View>
              
              <TouchableOpacity
                style={[styles.uploadButton, { 
                  backgroundColor: tabColor + '10',
                  borderColor: tabColor,
                  borderStyle: 'dashed'
                }]}
                onPress={handleFileUpload}
                disabled={uploading}
              >
                {uploading ? (
                  <>
                    <ActivityIndicator size="small" color={tabColor} />
                    <ThemedText style={[styles.uploadButtonText, { color: tabColor }]}>
                      Uploading... {uploadProgress}%
                    </ThemedText>
                  </>
                ) : (
                  <>
                    <Feather name="upload-cloud" size={24} color={tabColor} />
                    <ThemedText style={[styles.uploadButtonText, { color: tabColor }]}>
                      Select Excel File
                    </ThemedText>
                  </>
                )}
              </TouchableOpacity>
              
              {uploading && uploadProgress > 0 && (
                <View style={styles.progressContainer}>
                  <View style={styles.progressBarContainer}>
                    <View 
                      style={[
                        styles.progressBarFill,
                        { 
                          backgroundColor: tabColor,
                          width: `${uploadProgress}%` 
                        }
                      ]} 
                    />
                  </View>
                  <ThemedText style={[styles.progressText, { color: colors.textSecondary }]}>
                    {uploadProgress}% uploaded
                  </ThemedText>
                </View>
              )}
            </View>

            {/* Upload Results */}
            {uploadResult && (
              <View style={[styles.resultCard, { 
                borderColor: (uploadResult.errors && uploadResult.errors.length > 0) ? colors.warning : colors.success,
                backgroundColor: (uploadResult.errors && uploadResult.errors.length > 0) ? colors.warning + '10' : colors.success + '10'
              }]}>
                <View style={styles.resultHeader}>
                  <View style={[styles.resultIcon, { 
                    backgroundColor: (uploadResult.errors && uploadResult.errors.length > 0) ? colors.warning + '20' : colors.success + '20' 
                  }]}>
                    <Feather 
                      name={(uploadResult.errors && uploadResult.errors.length > 0) ? "alert-triangle" : "check-circle"} 
                      size={24} 
                      color={(uploadResult.errors && uploadResult.errors.length > 0) ? colors.warning : colors.success} 
                    />
                  </View>
                  <View style={styles.resultTitleContainer}>
                    <ThemedText type="subtitle" style={[styles.resultTitle, { 
                      color: (uploadResult.errors && uploadResult.errors.length > 0) ? colors.warning : colors.success
                    }]}>
                      {(uploadResult.errors && uploadResult.errors.length > 0) ? 'Upload Completed with Errors' : 'Upload Successful!'}
                    </ThemedText>
                    <ThemedText style={[styles.resultSubtitle, { color: colors.textSecondary }]}>
                      {uploadResult.created || uploadResult.updated ? 'Data processed successfully' : 'No data was processed'}
                    </ThemedText>
                  </View>
                </View>
                
                <View style={[styles.resultStats, { backgroundColor: colors.background }]}>
                  <View style={styles.statItem}>
                    <ThemedText style={[styles.statValue, { color: colors.text }]}>
                      {(uploadResult.created || 0) + (uploadResult.updated || 0)}
                    </ThemedText>
                    <ThemedText style={[styles.statLabel, { color: colors.textSecondary }]}>
                      Total Processed
                    </ThemedText>
                  </View>
                  
                  {uploadResult.created > 0 && (
                    <View style={styles.statItem}>
                      <ThemedText style={[styles.statValue, { color: colors.success }]}>
                        {uploadResult.created}
                      </ThemedText>
                      <ThemedText style={[styles.statLabel, { color: colors.textSecondary }]}>
                        Created
                      </ThemedText>
                    </View>
                  )}
                  
                  {uploadResult.updated > 0 && (
                    <View style={styles.statItem}>
                      <ThemedText style={[styles.statValue, { color: colors.info }]}>
                        {uploadResult.updated}
                      </ThemedText>
                      <ThemedText style={[styles.statLabel, { color: colors.textSecondary }]}>
                        Updated
                      </ThemedText>
                    </View>
                  )}
                  
                  {uploadResult.errors && uploadResult.errors.length > 0 && (
                    <View style={styles.statItem}>
                      <ThemedText style={[styles.statValue, { color: colors.error }]}>
                        {uploadResult.errors.length}
                      </ThemedText>
                      <ThemedText style={[styles.statLabel, { color: colors.textSecondary }]}>
                        Errors
                      </ThemedText>
                    </View>
                  )}
                  
                  {uploadResult.skipped > 0 && (
                    <View style={styles.statItem}>
                      <ThemedText style={[styles.statValue, { color: colors.textSecondary }]}>
                        {uploadResult.skipped}
                      </ThemedText>
                      <ThemedText style={[styles.statLabel, { color: colors.textSecondary }]}>
                        Skipped
                      </ThemedText>
                    </View>
                  )}
                </View>
                
                {uploadResult.errors && uploadResult.errors.length > 0 && (
                  <View style={styles.errorSection}>
                    <View style={styles.errorHeader}>
                      <Feather name="alert-circle" size={16} color={colors.error} />
                      <ThemedText style={[styles.errorTitle, { color: colors.text }]}>
                        Errors ({uploadResult.errors.length}):
                      </ThemedText>
                    </View>
                    <ScrollView style={styles.errorsList} showsVerticalScrollIndicator={false}>
                      {uploadResult.errors.slice(0, 10).map((error, index) => (
                        <View key={index} style={[styles.errorItem, { 
                          backgroundColor: colors.error + '10',
                          borderLeftColor: colors.error
                        }]}>
                          <ThemedText style={[styles.errorRow, { color: colors.text }]}>
                            Row {error.row}: 
                          </ThemedText>
                          <ThemedText style={[styles.errorText, { color: colors.error }]}>
                            {error.message || error.error}
                          </ThemedText>
                        </View>
                      ))}
                      {uploadResult.errors.length > 10 && (
                        <View style={styles.moreErrors}>
                          <ThemedText style={[styles.moreErrorsText, { color: colors.textSecondary }]}>
                            + {uploadResult.errors.length - 10} more errors...
                          </ThemedText>
                        </View>
                      )}
                    </ScrollView>
                  </View>
                )}
              </View>
            )}
          </ScrollView>
          
          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            <TouchableOpacity
              style={[styles.button, { 
                backgroundColor: colors.inputBackground,
                borderColor: colors.border
              }]}
              onPress={() => {
                if (uploadResult) {
                  onClose()
                } else if (uploading) {
                  Alert.alert(
                    'Cancel Upload',
                    'Are you sure you want to cancel the upload?',
                    [
                      { text: 'No', style: 'cancel' },
                      { 
                        text: 'Yes', 
                        style: 'destructive',
                        onPress: onClose
                      }
                    ]
                  )
                } else {
                  onClose()
                }
              }}
              disabled={uploading && !uploadResult}
            >
              <ThemedText style={[styles.buttonText, { color: colors.text }]}>
                {uploadResult ? 'Close' : uploading ? 'Cancel' : 'Cancel Upload'}
              </ThemedText>
            </TouchableOpacity>
            
            {uploadResult && (
              <TouchableOpacity
                style={[styles.button, { 
                  backgroundColor: tabColor,
                  borderColor: tabColor
                }]}
                onPress={onRefresh}
              >
                <Feather name="refresh-cw" size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
                <ThemedText style={[styles.buttonText, { color: '#FFFFFF' }]}>
                  Refresh Data
                </ThemedText>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  )
})

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: SCREEN_WIDTH * 0.9,
    maxHeight: '80%',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    maxHeight: 500,
    padding: 20,
  },
  stepCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  stepIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepTextContainer: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 15,
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 12,
    lineHeight: 16,
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  downloadButtonText: {
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
  },
  infoContainer: {
    padding: 12,
    borderRadius: 8,
  },
  infoTitle: {
    fontSize: 12,
    marginBottom: 8,
    fontFamily: 'Poppins-Medium',
  },
  columnsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  columnItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  columnText: {
    fontSize: 10,
    fontFamily: 'Poppins-Medium',
  },
  instructions: {
    marginBottom: 16,
  },
  instructionsTitle: {
    fontSize: 12,
    marginBottom: 8,
    fontFamily: 'Poppins-Medium',
  },
  instructionsList: {
    gap: 6,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  instructionText: {
    fontSize: 11,
    fontFamily: 'Poppins-Medium',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 18,
    borderRadius: 12,
    borderWidth: 2,
    marginBottom: 8,
  },
  uploadButtonText: {
    fontSize: 15,
    fontFamily: 'Poppins-SemiBold',
  },
  progressContainer: {
    marginTop: 8,
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: '#e5e5e5',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 11,
    textAlign: 'center',
    fontFamily: 'Poppins-Medium',
  },
  resultCard: {
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    borderWidth: 1,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  resultIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  resultTitleContainer: {
    flex: 1,
  },
  resultTitle: {
    fontSize: 16,
    marginBottom: 2,
  },
  resultSubtitle: {
    fontSize: 12,
  },
  resultStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontFamily: 'Poppins-Bold',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
    fontFamily: 'Poppins-Medium',
  },
  errorSection: {
    marginTop: 8,
  },
  errorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  errorTitle: {
    fontSize: 13,
    fontFamily: 'Poppins-SemiBold',
  },
  errorsList: {
    maxHeight: 150,
  },
  errorItem: {
    borderRadius: 6,
    padding: 10,
    marginBottom: 6,
    borderLeftWidth: 3,
  },
  errorRow: {
    fontSize: 11,
    fontFamily: 'Poppins-Medium',
    marginBottom: 2,
  },
  errorText: {
    fontSize: 11,
    fontFamily: 'Poppins-Medium',
  },
  moreErrors: {
    alignItems: 'center',
    padding: 8,
  },
  moreErrorsText: {
    fontSize: 11,
    fontFamily: 'Poppins-Medium',
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
  },
})

export default BulkUploadModal