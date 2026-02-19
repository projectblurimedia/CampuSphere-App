import React, { useState } from 'react'
import { 
  StyleSheet, 
  View, 
  TouchableOpacity, 
  Image,
  Modal 
} from 'react-native'
import { Ionicons, MaterialIcons } from '@expo/vector-icons'
import { useTheme } from '@/hooks/useTheme'
import { ThemedText } from '@/components/ui/themed-text'
import Employee from '@/pages/employee/Employee'

const EmployeeCard = ({ employee, onPress }) => {
  const { colors } = useTheme()
  const [showEmployeeModal, setShowEmployeeModal] = useState(false)

  // Format date to readable format
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  // Get initials for avatar fallback
  const getInitials = () => {
    const first = employee.firstName?.charAt(0) || ''
    const last = employee.lastName?.charAt(0) || ''
    return (first + last).toUpperCase() || 'E'
  }

  // Get gender icon and color
  const getGenderInfo = () => {
    switch(employee.gender) {
      case 'MALE':
        return { icon: 'male', color: '#3b82f6' }
      case 'FEMALE':
        return { icon: 'female', color: '#ec4899' }
      default:
        return { icon: 'person-outline', color: colors.textSecondary }
    }
  }

  const handleEmployeePress = () => {
    if (onPress) {
      // If custom onPress is provided, use it
      onPress(employee)
    } else {
      // Default behavior - open Employee modal
      setShowEmployeeModal(true)
    }
  }

  const closeEmployeeModal = (shouldRefresh) => {
    setShowEmployeeModal(false)
    // If refresh is needed, you can call a callback here
    if (shouldRefresh && onPress) {
      // Handle refresh if needed
    }
  }

  const genderInfo = getGenderInfo()

  const styles = StyleSheet.create({
    card: {
      borderRadius: 16,
      borderWidth: 1,
      marginBottom: 12,
      overflow: 'hidden',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
      backgroundColor: colors.cardBackground,
      borderColor: colors.border,
      shadowColor: colors.text,
    },
    cardContent: {
      flexDirection: 'row',
      padding: 12,
    },
    avatarContainer: {
      marginRight: 12,
    },
    avatar: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.primary + '20',
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
    },
    avatarImage: {
      width: '100%',
      height: '100%',
    },
    initialsText: {
      fontSize: 20,
      fontFamily: 'Poppins-SemiBold',
      color: colors.primary,
    },
    infoContainer: {
      flex: 1,
      justifyContent: 'center',
    },
    nameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 2,
    },
    name: {
      fontSize: 16,
      fontFamily: 'Poppins-SemiBold',
      color: colors.text,
      marginRight: 6,
    },
    genderIcon: {
      marginRight: 4,
    },
    designationBadge: {
      alignSelf: 'flex-start',
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 12,
      backgroundColor: colors.primary + '15',
      marginBottom: 6,
    },
    designationText: {
      fontSize: 11,
      color: colors.primary,
      fontFamily: 'Poppins-SemiBold',
    },
    footer: {
      flexDirection: 'row',
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    footerItem: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    footerDivider: {
      width: 1,
      backgroundColor: colors.border,
    },
    footerText: {
      fontSize: 12,
      color: colors.textSecondary,
      marginLeft: 4,
    },
    statusDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginRight: 6,
    },
    statusActive: {
      backgroundColor: '#10b981',
    },
    statusInactive: {
      backgroundColor: '#ef4444',
    },
  })

  return (
    <>
      <TouchableOpacity 
        style={styles.card}
        activeOpacity={0.7}
        onPress={handleEmployeePress}
      >
        <View style={styles.cardContent}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              {employee.profilePicUrl ? (
                <Image 
                  source={{ uri: employee.profilePicUrl }} 
                  style={styles.avatarImage}
                />
              ) : (
                <ThemedText style={styles.initialsText}>
                  {getInitials()}
                </ThemedText>
              )}
            </View>
          </View>

          <View style={styles.infoContainer}>
            <View style={styles.nameRow}>
              <ThemedText style={styles.name} numberOfLines={1}>
                {employee.firstName} {employee.lastName}
              </ThemedText>
              <MaterialIcons 
                name={genderInfo.icon} 
                size={20} 
                color={genderInfo.color}
                style={styles.genderIcon}
              />
            </View>

            <View style={styles.designationBadge}>
              <ThemedText style={styles.designationText}>
                {employee.designationDisplay || employee.designation}
              </ThemedText>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <View style={styles.footerItem}>
            <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
            <ThemedText style={styles.footerText}>
              Joined {formatDate(employee.joiningDate)}
            </ThemedText>
          </View>

          <View style={styles.footerDivider} />

          <View style={styles.footerItem}>
            <View style={[
              styles.statusDot,
              employee.isActive ? styles.statusActive : styles.statusInactive
            ]} />
            <ThemedText style={styles.footerText}>
              {employee.isActive ? 'Active' : 'Inactive'}
            </ThemedText>
          </View>
        </View>
      </TouchableOpacity>

      {/* Default Employee Modal - only shown when onPress is not provided */}
      <Modal
        animationType="fade"
        statusBarTranslucent
        transparent={false}
        visible={showEmployeeModal}
        onRequestClose={() => closeEmployeeModal(false)}
      >
        <Employee 
          employee={employee} 
          onClose={closeEmployeeModal} 
        />
      </Modal>
    </>
  )
}

export default EmployeeCard