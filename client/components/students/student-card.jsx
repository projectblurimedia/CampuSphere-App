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
    const name = student.name || `${student.firstName || ''} ${student.lastName || ''}`.trim() || 'S'
    const profilePic = student.profilePicUrl
    
    if (profilePic) {
      return (
        <Image source={{ uri: profilePic }} style={styles.studentAvatar} />
      )
    }
    
    return (
      <LinearGradient
        colors={[colors.primary, colors.tint]}
        style={styles.studentAvatar}
      >
        <ThemedText style={[styles.avatarText, { color: '#fff' }]}>
          {name.charAt(0).toUpperCase()}
        </ThemedText>
      </LinearGradient>
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
          <View style={styles.studentDetails}>
            {renderAvatar()}
            <View style={styles.studentInfo}>
              <ThemedText 
                type="subtitle" 
                style={[styles.studentName, { color: colors.text }]}
                numberOfLines={1}
              >
                {student.name || `${student.firstName || ''} ${student.lastName || ''}`.trim()}
              </ThemedText>
              <View style={styles.rollContainer}>
                <Ionicons name="id-card-outline" size={12} color={colors.textSecondary} />
                <ThemedText style={[styles.rollText, { color: colors.textSecondary, marginLeft: 4 }]}>
                  Roll No: {student.rollNo || student.admissionNo || 'N/A'}
                </ThemedText>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
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
    marginBottom: 12,
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
  studentDetails: {
    flexDirection: 'row',
    alignItems: 'center',
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
    marginRight: 8,
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
})