import { useState } from 'react'
import { View, StyleSheet, TouchableOpacity, Image, Modal } from 'react-native'
import { ThemedText } from '@/components/ui/themed-text'
import { Ionicons, Feather } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useTheme } from '@/hooks/useTheme'
import Student from '@/pages/student/Student'

export default function StudentCard({ student }) {
  const { colors } = useTheme()
  const [showStudentModal, setShowStudentModal] = useState(false)
  
  const handleStudentPress = () => {
    setShowStudentModal(true)
  }

  const closeStudentModal = () => {
    setShowStudentModal(false)
  }

  const renderAvatar = () => {
    if (student.profilePic) {
      return (
        <Image source={{ uri: student.profilePic }} style={styles.studentAvatar} />
      )
    }
    
    return (
      <LinearGradient
        colors={[colors.primary, colors.tint]}
        style={styles.studentAvatar}
      >
        <ThemedText style={[styles.avatarText, { color: '#fff' }]}>
          {student.name.charAt(0).toUpperCase()}
        </ThemedText>
      </LinearGradient>
    )
  }

  const renderFeesBadge = () => {
    const isPaid = student.fees === 'Paid'
    return (
      <View style={[
        styles.statusBadge, 
        { 
          backgroundColor: isPaid ? `${colors.success}15` : `${colors.warning}15`,
          borderColor: isPaid ? colors.success : colors.warning
        }
      ]}>
        <Ionicons 
          name={isPaid ? "checkmark-circle" : "alert-circle"} 
          size={12} 
          color={isPaid ? colors.success : colors.warning} 
          style={styles.badgeIcon}
        />
        <ThemedText style={{ 
          fontSize: 11, 
          fontWeight: '600',
          color: isPaid ? colors.success : colors.warning,
          marginLeft: 4
        }}>
          {student.fees}
        </ThemedText>
      </View>
    )
  }

  return (
    <>
      <TouchableOpacity 
        style={[styles.studentCard, { 
          backgroundColor: colors.cardBackground, 
          borderColor: colors.border,
          shadowColor: colors.shadow || '#00000040'
        }]}
        activeOpacity={0.8}
        onPress={handleStudentPress}
      >
        <View style={styles.innerCard}>
          {/* Header */}
          <View style={styles.studentHeader}>
            {renderAvatar()}
            <View style={styles.studentInfo}>
              <ThemedText type="subtitle" style={[styles.studentName, { color: colors.text }]}>
                {student.name}
              </ThemedText>
              <View style={styles.rollContainer}>
                <Ionicons name="id-card-outline" size={12} color={colors.textSecondary} />
                <ThemedText style={[styles.rollText, { color: colors.textSecondary, marginLeft: 4 }]}>
                  Roll No: {student.rollNo}
                </ThemedText>
              </View>
            </View>
            {renderFeesBadge()}
          </View>

          {/* Divider */}
          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          {/* Details */}
          <View style={styles.studentDetails}>
            <View style={styles.detailRow}>
              <View style={styles.detailItem}>
                <Ionicons name="school-outline" size={16} color={colors.primary} />
                <ThemedText style={[styles.detailLabel, { color: colors.text, marginLeft: 8 }]}>
                  {student.class}
                </ThemedText>
              </View>
              <View style={styles.detailItem}>
                <Feather name="calendar" size={16} color={colors.primary} />
                <ThemedText style={[styles.detailLabel, { color: colors.text, marginLeft: 8 }]}>
                  {student.attendance}
                </ThemedText>
              </View>
            </View>

            {/* Parent and Phone Row */}
            {(student.parent || student.contact) && (
              <View style={styles.parentRow}>
                <View style={styles.parentItem}>
                  <Ionicons name="person-outline" size={14} color={colors.textSecondary} />
                  <ThemedText style={[styles.parentText, { color: colors.textSecondary, marginLeft: 8 }]}>
                    {student.parent || 'N/A'}
                  </ThemedText>
                </View>
                <View style={styles.parentItem}>
                  <Feather name="phone" size={14} color={colors.textSecondary} />
                  <ThemedText style={[styles.parentText, { color: colors.textSecondary, marginLeft: 8 }]}>
                    {student.contact || 'N/A'}
                  </ThemedText>
                </View>
              </View>
            )}

            {/* Action Button */}
            <TouchableOpacity style={[styles.viewBtn, { borderColor: colors.primary }]}>
              <ThemedText style={[styles.viewBtnText, { color: colors.primary }]}>
                View Details
              </ThemedText>
              <Ionicons name="chevron-forward" size={14} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>

      <Modal
        animationType="fade"
        statusBarTranslucent
        transparent={false}
        visible={showStudentModal}
        onRequestClose={closeStudentModal}
      >
        <Student 
          student={student} 
          onClose={closeStudentModal} 
        />
      </Modal>
    </>
  )
}

const styles = StyleSheet.create({
  studentCard: {
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 16,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  innerCard: {
    padding: 16,
    borderRadius: 20,
  },
  studentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  studentAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  rollContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rollText: {
    fontSize: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  badgeIcon: {
    marginRight: 2,
  },
  divider: {
    height: 1,
    marginBottom: 12,
  },
  studentDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 0.48,
  },
  detailLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  parentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  parentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 0.48,
  },
  parentText: {
    fontSize: 12,
    fontWeight: '500',
  },
  viewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: 12,
    marginTop: 4,
  },
  viewBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
})