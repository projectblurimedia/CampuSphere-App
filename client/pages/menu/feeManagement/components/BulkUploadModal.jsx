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
  onUpload,
  onClose,
  onRefresh,
}) => {
  const handleFileUpload = async () => {
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

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return
      }

      const asset = result.assets[0]
      
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

      let fileUri = asset.uri
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
        return [
          'className* (PRE_NURSERY, NURSERY, LKG, UKG, CLASS_1 to CLASS_12)',
          'totalAnnualFee*',
          'tuitionFee (optional)',
          'examFee (optional)',
          'activityFee (optional)',
          'booksFee (optional)',
          'sportsFee (optional)',
          'labFee (optional)',
          'computerFee (optional)',
          'otherCharges (optional)',
          'description (optional)'
        ]
      case 'bus':
        return [
          'villageName*',
          'feeAmount*',
          'distance (optional)',
          'description (optional)'
        ]
      case 'hostel':
        return [
          'className* (PRE_NURSERY, NURSERY, LKG, UKG, CLASS_1 to CLASS_12)',
          'totalAnnualFee*',
          'totalTerms (optional, default: 3)',
          'description (optional)'
        ]
      default:
        return []
    }
  }

  const tabColor = getTabColor()
  const tabName = getTabName()
  const requiredColumns = getRequiredColumns()

  // Format rejection reason for display
  const formatRejectionReason = (reason) => {
    if (!reason) return 'Unknown error';
    
    // Make rejection reasons more readable
    if (reason.includes('duplicate')) {
      return 'Duplicate entry - already exists';
    }
    if (reason.includes('required') || reason.includes('Missing')) {
      return 'Missing required field';
    }
    if (reason.includes('Invalid') || reason.includes('invalid')) {
      return 'Invalid data format';
    }
    if (reason.includes('not match') || reason.includes('does not match')) {
      return 'Component total does not match total annual fee';
    }
    if (reason.includes('not found')) {
      return 'Record not found';
    }
    if (reason.includes('permission')) {
      return 'Permission denied';
    }
    if (reason.includes('Active fee structure already exists')) {
      return 'Active fee structure already exists for this class/village';
    }
    return reason;
  };

  // Get category for grouping errors
  const getRejectionCategory = (reason) => {
    const reasonLower = reason.toLowerCase();
    if (reasonLower.includes('duplicate') || reasonLower.includes('already exists')) return 'duplicate';
    if (reasonLower.includes('required') || reasonLower.includes('missing')) return 'missing';
    if (reasonLower.includes('invalid') || reasonLower.includes('format')) return 'invalid';
    if (reasonLower.includes('not match') || reasonLower.includes('does not match')) return 'mismatch';
    if (reasonLower.includes('not found')) return 'not_found';
    if (reasonLower.includes('permission')) return 'permission';
    return 'other';
  };

  // Group rejections by reason category
  const groupRejectionsByReason = (errors) => {
    if (!errors || errors.length === 0) return {};
    
    return errors.reduce((acc, item) => {
      const reason = item.reason || item.error || 'Unknown error';
      const category = getRejectionCategory(reason);
      
      if (!acc[category]) {
        acc[category] = {
          count: 0,
          examples: [],
          mainReason: formatRejectionReason(reason)
        };
      }
      
      acc[category].count++;
      
      // Store up to 3 examples for each category
      if (acc[category].examples.length < 3) {
        const identifier = item.className || item.villageName || `Row ${item.rowNumber || item.row || '?'}`;
        acc[category].examples.push({
          identifier,
          reason: formatRejectionReason(reason),
          rowNumber: item.rowNumber || item.row
        });
      }
      
      return acc;
    }, {});
  };

  // Render upload details with proper response structure
  const renderUploadDetails = () => {
    if (!uploadResult) return null;

    // Handle different response structures
    const summary = uploadResult.summary || uploadResult;
    
    const totalRecords = summary.total || 
      (summary.success || 0) + (summary.failed || 0) + (summary.skipped || 0);
    
    const successCount = summary.success || uploadResult.data?.length || 0;
    const failedCount = summary.failed || 0;
    const skippedCount = summary.skipped || 0;
    
    // Get errors array from summary
    const errors = summary.errors || [];
    
    // Get successful records from data array
    const successfulRecords = uploadResult.data || [];

    // Group errors by reason
    const rejectionGroups = groupRejectionsByReason(errors);

    return (
      <>
        {/* Summary Stats */}
        <View style={[styles.summaryCard, { backgroundColor: colors.inputBackground }]}>
          <View style={styles.summaryHeader}>
            <MaterialIcons name="analytics" size={20} color={tabColor} />
            <ThemedText style={[styles.summaryTitle, { color: colors.text }]}>
              Upload Summary
            </ThemedText>
          </View>
          
          <View style={styles.summaryStats}>
            <View style={[styles.summaryStatItem, { backgroundColor: colors.background }]}>
              <Feather name="database" size={16} color={colors.textSecondary} />
              <ThemedText style={[styles.summaryStatLabel, { color: colors.textSecondary }]}>
                Total
              </ThemedText>
              <ThemedText style={[styles.summaryStatValue, { color: colors.text }]}>
                {totalRecords}
              </ThemedText>
            </View>
            
            <View style={[styles.summaryStatItem, { backgroundColor: colors.success + '10' }]}>
              <Feather name="check-circle" size={16} color={colors.success} />
              <ThemedText style={[styles.summaryStatLabel, { color: colors.textSecondary }]}>
                Success
              </ThemedText>
              <ThemedText style={[styles.summaryStatValue, { color: colors.success }]}>
                {successCount}
              </ThemedText>
            </View>
            
            {skippedCount > 0 && (
              <View style={[styles.summaryStatItem, { backgroundColor: colors.warning + '10' }]}>
                <Feather name="skip-forward" size={16} color={colors.warning} />
                <ThemedText style={[styles.summaryStatLabel, { color: colors.textSecondary }]}>
                  Skipped
                </ThemedText>
                <ThemedText style={[styles.summaryStatValue, { color: colors.warning }]}>
                  {skippedCount}
                </ThemedText>
              </View>
            )}
            
            <View style={[styles.summaryStatItem, { backgroundColor: colors.error + '10' }]}>
              <Feather name="x-circle" size={16} color={colors.error} />
              <ThemedText style={[styles.summaryStatLabel, { color: colors.textSecondary }]}>
                Failed
              </ThemedText>
              <ThemedText style={[styles.summaryStatValue, { color: colors.error }]}>
                {failedCount}
              </ThemedText>
            </View>
          </View>
          
          {totalRecords > 0 && (
            <>
              <View style={[styles.progressBarLarge, { backgroundColor: colors.background }]}>
                <View 
                  style={[
                    styles.progressFillSuccess,
                    { 
                      width: `${(successCount / totalRecords) * 100}%`,
                      backgroundColor: colors.success
                    }
                  ]} 
                />
                {skippedCount > 0 && (
                  <View 
                    style={[
                      styles.progressFillSkipped,
                      { 
                        left: `${(successCount / totalRecords) * 100}%`,
                        width: `${(skippedCount / totalRecords) * 100}%`,
                        backgroundColor: colors.warning
                      }
                    ]} 
                  />
                )}
                <View 
                  style={[
                    styles.progressFillError,
                    { 
                      left: `${((successCount + skippedCount) / totalRecords) * 100}%`,
                      width: `${(failedCount / totalRecords) * 100}%`,
                      backgroundColor: colors.error
                    }
                  ]} 
                />
              </View>
              
              <View style={styles.percentageRow}>
                <ThemedText style={[styles.percentageText, { color: colors.success }]}>
                  {((successCount / totalRecords) * 100).toFixed(1)}% Success
                </ThemedText>
                {skippedCount > 0 && (
                  <ThemedText style={[styles.percentageText, { color: colors.warning }]}>
                    {((skippedCount / totalRecords) * 100).toFixed(1)}% Skipped
                  </ThemedText>
                )}
                <ThemedText style={[styles.percentageText, { color: colors.error }]}>
                  {((failedCount / totalRecords) * 100).toFixed(1)}% Failed
                </ThemedText>
              </View>
            </>
          )}
        </View>

        {/* Successful Records Details */}
        {successCount > 0 && successfulRecords.length > 0 && (
          <View style={[styles.detailsCard, { 
            backgroundColor: colors.success + '05',
            borderColor: colors.success + '20'
          }]}>
            <View style={styles.detailsHeader}>
              <View style={[styles.detailsIcon, { backgroundColor: colors.success + '15' }]}>
                <Feather name="check-circle" size={20} color={colors.success} />
              </View>
              <View style={styles.detailsTitleContainer}>
                <ThemedText style={[styles.detailsTitle, { color: colors.success }]}>
                  Successfully Uploaded ({successCount})
                </ThemedText>
                <ThemedText style={[styles.detailsSubtitle, { color: colors.textSecondary }]}>
                  Records added/updated successfully
                </ThemedText>
              </View>
            </View>
            
            <View style={styles.successList}>
              {successfulRecords.slice(0, 5).map((item, index) => (
                <View key={index} style={[styles.successItem, { 
                  backgroundColor: colors.background,
                  borderColor: colors.border
                }]}>
                  <Feather name="check" size={14} color={colors.success} />
                  <ThemedText style={[styles.successItemText, { color: colors.text }]}>
                    {activeTab === 'bus' 
                      ? item.villageName 
                      : item.className || `Record #${item.id?.substring(0, 8) || index + 1}`}
                  </ThemedText>
                  {item.totalAnnualFee && (
                    <ThemedText style={[styles.successItemAmount, { color: colors.textSecondary }]}>
                      ₹{item.totalAnnualFee.toLocaleString()}
                    </ThemedText>
                  )}
                </View>
              ))}
              {successCount > 5 && (
                <ThemedText style={[styles.moreText, { color: colors.textSecondary }]}>
                  + {successCount - 5} more records
                </ThemedText>
              )}
            </View>
          </View>
        )}

        {/* Rejected Records Details with Grouped Reasons */}
        {failedCount > 0 && errors.length > 0 && (
          <View style={[styles.detailsCard, { 
            backgroundColor: colors.error + '05',
            borderColor: colors.error + '20'
          }]}>
            <View style={styles.detailsHeader}>
              <View style={[styles.detailsIcon, { backgroundColor: colors.error + '15' }]}>
                <Feather name="x-circle" size={20} color={colors.error} />
              </View>
              <View style={styles.detailsTitleContainer}>
                <ThemedText style={[styles.detailsTitle, { color: colors.error }]}>
                  Failed Uploads ({failedCount})
                </ThemedText>
                <ThemedText style={[styles.detailsSubtitle, { color: colors.textSecondary }]}>
                  Records that could not be processed
                </ThemedText>
              </View>
            </View>
            
            {/* Grouped Rejection Reasons */}
            {Object.entries(rejectionGroups).map(([category, data]) => (
              <View key={category} style={styles.rejectionGroup}>
                <View style={styles.rejectionGroupHeader}>
                  <View style={[styles.rejectionBadge, { 
                    backgroundColor: 
                      category === 'duplicate' ? colors.warning + '15' :
                      category === 'missing' ? colors.error + '15' :
                      category === 'invalid' ? colors.primary + '15' :
                      category === 'mismatch' ? colors.primary + '15' :
                      category === 'not_found' ? colors.info + '15' :
                      colors.textSecondary + '15'
                  }]}>
                    <Feather 
                      name={
                        category === 'duplicate' ? 'copy' :
                        category === 'missing' ? 'alert-triangle' :
                        category === 'invalid' ? 'alert-circle' :
                        category === 'mismatch' ? 'slash' :
                        category === 'not_found' ? 'search' :
                        'help-circle'
                      } 
                      size={14} 
                      color={
                        category === 'duplicate' ? colors.warning :
                        category === 'missing' ? colors.error :
                        category === 'invalid' ? colors.primary :
                        category === 'mismatch' ? colors.primary :
                        category === 'not_found' ? colors.info :
                        colors.textSecondary
                      } 
                    />
                  </View>
                  <View style={styles.rejectionGroupInfo}>
                    <ThemedText style={[styles.rejectionGroupTitle, { color: colors.text }]}>
                      {category === 'duplicate' ? 'Duplicate Entries' :
                       category === 'missing' ? 'Missing Required Fields' :
                       category === 'invalid' ? 'Invalid Data Format' :
                       category === 'mismatch' ? 'Fee Component Mismatch' :
                       category === 'not_found' ? 'Records Not Found' :
                       'Other Errors'} ({data.count})
                    </ThemedText>
                    <ThemedText style={[styles.rejectionGroupReason, { color: colors.textSecondary }]}>
                      {data.mainReason}
                    </ThemedText>
                  </View>
                </View>
                
                <View style={styles.rejectionExamples}>
                  {data.examples.map((example, idx) => (
                    <View key={idx} style={[styles.rejectionExample, { 
                      backgroundColor: colors.background,
                      borderLeftColor: 
                        category === 'duplicate' ? colors.warning :
                        category === 'missing' ? colors.error :
                        category === 'invalid' ? colors.primary :
                        category === 'mismatch' ? colors.primary :
                        category === 'not_found' ? colors.info :
                        colors.textSecondary
                    }]}>
                      <View style={styles.rejectionExampleHeader}>
                        <ThemedText style={[styles.rejectionExampleIdentifier, { color: colors.text }]}>
                          {example.identifier}
                        </ThemedText>
                        {example.rowNumber && (
                          <ThemedText style={[styles.rejectionExampleRow, { color: colors.textSecondary }]}>
                            Row {example.rowNumber}
                          </ThemedText>
                        )}
                      </View>
                      <ThemedText style={[styles.rejectionExampleReason, { color: colors.textSecondary }]}>
                        {example.reason}
                      </ThemedText>
                    </View>
                  ))}
                </View>
              </View>
            ))}
            
            {/* Show remaining count if more than examples shown */}
            {failedCount > Object.values(rejectionGroups).reduce((acc, group) => acc + group.examples.length, 0) && (
              <View style={styles.moreErrors}>
                <Feather name="more-horizontal" size={16} color={colors.textSecondary} />
                <ThemedText style={[styles.moreErrorsText, { color: colors.textSecondary }]}>
                  {failedCount - Object.values(rejectionGroups).reduce((acc, group) => acc + group.examples.length, 0)} more errors...
                </ThemedText>
              </View>
            )}
          </View>
        )}
      </>
    );
  };

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
              <ThemedText type='subtitle' style={[styles.title, { color: colors.text }]}>
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
            {/* File Upload Section */}
            <View style={[styles.uploadCard, { backgroundColor: tabColor + '05', borderColor: tabColor + '20' }]}>
              <View style={styles.uploadHeader}>
                <View style={[styles.uploadIcon, { backgroundColor: tabColor + '15' }]}>
                  <Feather name="upload-cloud" size={24} color={tabColor} />
                </View>
                <View style={styles.uploadTextContainer}>
                  <ThemedText style={[styles.uploadTitle, { color: tabColor }]}>
                    Upload Excel File
                  </ThemedText>
                  <ThemedText style={[styles.uploadDescription, { color: colors.textSecondary }]}>
                    Select your prepared Excel file. Existing records will be updated, new ones created.
                  </ThemedText>
                </View>
              </View>
              
              {/* Required Columns Info */}
              <View style={[styles.infoContainer, { backgroundColor: colors.inputBackground }]}>
                <View style={styles.infoHeader}>
                  <MaterialIcons name="info-outline" size={16} color={colors.textSecondary} />
                  <ThemedText style={[styles.infoTitle, { color: colors.text }]}>
                    Required Columns:
                  </ThemedText>
                </View>
                <View style={styles.columnsList}>
                  {requiredColumns.map((column, index) => (
                    <View key={index} style={[styles.columnItem, { 
                      backgroundColor: colors.background,
                      borderColor: colors.border
                    }]}>
                      <Feather 
                        name={column.includes('*') ? "check-circle" : "circle"} 
                        size={12} 
                        color={column.includes('*') ? colors.success : colors.textSecondary} 
                      />
                      <ThemedText style={[
                        styles.columnText, 
                        { color: column.includes('*') ? colors.text : colors.textSecondary }
                      ]}>
                        {column}
                      </ThemedText>
                    </View>
                  ))}
                </View>
              </View>
              
              {/* File Requirements */}
              <View style={styles.requirements}>
                <View style={styles.requirementItem}>
                  <MaterialIcons name="insert-drive-file" size={16} color={colors.textSecondary} />
                  <ThemedText style={[styles.requirementText, { color: colors.textSecondary }]}>
                    Excel (.xlsx, .xls)
                  </ThemedText>
                </View>
                <View style={styles.requirementItem}>
                  <MaterialIcons name="straighten" size={16} color={colors.textSecondary} />
                  <ThemedText style={[styles.requirementText, { color: colors.textSecondary }]}>
                    Max: 10MB
                  </ThemedText>
                </View>
                <View style={styles.requirementItem}>
                  <MaterialIcons name="format-list-bulleted" size={16} color={colors.textSecondary} />
                  <ThemedText style={[styles.requirementText, { color: colors.textSecondary }]}>
                    Header row required
                  </ThemedText>
                </View>
              </View>
              
              {/* Upload Button */}
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
              
              {/* Upload Progress */}
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
                    Uploading: {uploadProgress}% complete
                  </ThemedText>
                </View>
              )}
            </View>

            {/* Upload Results with Detailed Information */}
            {uploadResult && renderUploadDetails()}
          </ScrollView>
          
          {/* Footer Buttons */}
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
                {uploadResult ? 'Close' : uploading ? 'Cancel' : 'Cancel'}
              </ThemedText>
            </TouchableOpacity>
            
            {uploadResult && (
              <TouchableOpacity
                style={[styles.button, styles.refreshButton, { 
                  backgroundColor: tabColor,
                  borderColor: tabColor
                }]}
                onPress={onRefresh}
              >
                <Feather name="refresh-cw" size={16} color="#FFFFFF" />
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
    width: 48,
    height: 48,
    borderRadius: 24,
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
  uploadCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
  },
  uploadHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  uploadIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  uploadTextContainer: {
    flex: 1,
  },
  uploadTitle: {
    fontSize: 16,
    marginBottom: 4,
  },
  uploadDescription: {
    fontSize: 12,
    lineHeight: 16,
  },
  infoContainer: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 13,
  },
  columnsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  columnItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  columnText: {
    fontSize: 11,
  },
  requirements: {
    flexDirection: 'column',
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  requirementText: {
    fontSize: 11,
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
  },
  progressContainer: {
    marginTop: 12,
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
  },
  summaryCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 15,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 8,
  },
  summaryStatItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
  },
  summaryStatLabel: {
    fontSize: 11,
    marginTop: 4,
  },
  summaryStatValue: {
    fontSize: 20,
    marginTop: 2,
  },
  progressBarLarge: {
    height: 8,
    backgroundColor: '#e5e5e5',
    borderRadius: 4,
    overflow: 'hidden',
    flexDirection: 'row',
    marginBottom: 8,
    position: 'relative',
  },
  progressFillSuccess: {
    height: '100%',
    borderRadius: 4,
  },
  progressFillSkipped: {
    position: 'absolute',
    height: '100%',
    borderRadius: 4,
  },
  progressFillError: {
    position: 'absolute',
    height: '100%',
    borderRadius: 4,
  },
  percentageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  percentageText: {
    fontSize: 11,
  },
  detailsCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
  },
  detailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailsIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  detailsTitleContainer: {
    flex: 1,
  },
  detailsTitle: {
    fontSize: 15,
    marginBottom: 2,
  },
  detailsSubtitle: {
    fontSize: 11,
  },
  successList: {
    gap: 8,
  },
  successItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  successItemText: {
    fontSize: 12,
    flex: 1,
  },
  successItemAmount: {
    fontSize: 12,
  },
  rejectionGroup: {
    marginBottom: 16,
  },
  rejectionGroupHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  rejectionBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  rejectionGroupInfo: {
    flex: 1,
  },
  rejectionGroupTitle: {
    fontSize: 13,
    marginBottom: 2,
  },
  rejectionGroupReason: {
    fontSize: 11,
  },
  rejectionExamples: {
    marginLeft: 38,
    gap: 6,
  },
  rejectionExample: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
  },
  rejectionExampleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  rejectionExampleIdentifier: {
    fontSize: 11,
  },
  rejectionExampleRow: {
    fontSize: 10,
  },
  rejectionExampleReason: {
    fontSize: 11,
  },
  moreErrors: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 12,
    marginTop: 4,
  },
  moreErrorsText: {
    fontSize: 11,
  },
  moreText: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 8,
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
    gap: 8,
  },
  refreshButton: {
    gap: 8,
  },
  buttonText: {
    fontSize: 14,
  },
})

export default BulkUploadModal