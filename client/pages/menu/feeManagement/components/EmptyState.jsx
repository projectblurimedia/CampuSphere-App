import React from 'react'
import {
  View,
  StyleSheet,
  TouchableOpacity,
} from 'react-native'
import { ThemedText } from '@/components/ui/themed-text'
import {
  Feather,
  MaterialIcons,
  MaterialCommunityIcons,
} from '@expo/vector-icons'

const EmptyState = React.memo(({ activeTab, colors, onAdd, onUpload }) => {
  const getTabIcon = () => {
    switch(activeTab) {
      case 'class': return 'school'
      case 'bus': return 'directions-bus'
      case 'hostel': return 'home'
      default: return 'school'
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
      case 'class': return 'class fees'
      case 'bus': return 'bus fees'
      case 'hostel': return 'hostel fees'
      default: return 'fees'
    }
  }

  const tabIcon = getTabIcon()
  const tabColor = getTabColor()
  const tabName = getTabName()

  return (
    <View style={[styles.container, { paddingVertical: 40, paddingHorizontal: 20 }]}>
      <View style={[styles.iconContainer, { backgroundColor: tabColor + '20' }]}>
        <MaterialIcons name={tabIcon} size={40} color={tabColor} />
      </View>
      
      <ThemedText style={[styles.title, { color: colors.text }]}>
        No {tabName} found
      </ThemedText>
      
      <ThemedText style={[styles.subtitle, { color: colors.textSecondary }]}>
        {activeTab === 'class' 
          ? 'Start by adding class fees or uploading from Excel'
          : activeTab === 'bus'
          ? 'Start by adding bus fees or uploading from Excel'
          : 'Start by adding hostel fees or uploading from Excel'
        }
      </ThemedText>
      
      <View style={styles.buttonsContainer}>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: tabColor }]}
          onPress={onAdd}
        >
          <Feather name="plus" size={18} color="#FFFFFF" />
          <ThemedText style={[styles.addButtonText, { color: '#FFFFFF' }]}>
            Add {tabName}
          </ThemedText>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.uploadButton, { 
            backgroundColor: colors.inputBackground,
            borderColor: colors.border
          }]}
          onPress={onUpload}
        >
          <MaterialCommunityIcons name="file-excel" size={18} color={tabColor} />
          <ThemedText style={[styles.uploadButtonText, { color: tabColor }]}>
            Upload from Excel
          </ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  )
})

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    textAlign: 'center',
    marginBottom: 24,
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  addButtonText: {
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  uploadButtonText: {
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
  },
})

export default EmptyState