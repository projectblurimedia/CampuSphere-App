import { View, StyleSheet, TouchableOpacity } from 'react-native'
import { ThemedText } from '@/components/ui/themed-text'
import { Ionicons, Feather } from '@expo/vector-icons'
import { useTheme } from '@/hooks/useTheme'

export default function StudentCard({ student, dashboardColors }) {
  const { colors } = useTheme()
  
  return (
    <View style={[styles.studentCard, { 
      backgroundColor: dashboardColors.cardBg, 
      borderColor: dashboardColors.border,
      shadowColor: '#00000040'
    }]}>
      <View style={styles.studentHeader}>
        <View style={[styles.studentAvatar, { backgroundColor: colors.tint }]}>
          <ThemedText style={[styles.avatarText, { color: '#fff' }]}>
            {student.name.charAt(0)}
          </ThemedText>
        </View>
        <View style={styles.studentInfo}>
          <ThemedText type="defaultSemiBold" style={{ color: colors.text, fontSize: 15 }}>
            {student.name}
          </ThemedText>
          <ThemedText style={{ color: colors.textSecondary, fontSize: 12 }}>
            Roll No: {student.rollNo}
          </ThemedText>
        </View>
      </View>
      
      <View style={styles.studentDetails}>
        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <Ionicons name="school-outline" size={14} color={colors.textSecondary} />
            <ThemedText style={{ color: colors.textSecondary, fontSize: 12, marginLeft: 6 }}>
              {student.class}
            </ThemedText>
          </View>
          <View style={[styles.statusBadge, { 
            backgroundColor: student.fees === 'Paid' ? dashboardColors.success + '20' : dashboardColors.warning + '20' 
          }]}>
            <ThemedText style={{ 
              fontSize: 11, 
              fontWeight: '600',
              color: student.fees === 'Paid' ? dashboardColors.success : dashboardColors.warning
            }}>
              {student.fees}
            </ThemedText>
          </View>
        </View>
        
        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <Feather name="calendar" size={14} color={colors.textSecondary} />
            <ThemedText style={{ color: colors.textSecondary, fontSize: 12, marginLeft: 6 }}>
              Attendance: {student.attendance}
            </ThemedText>
          </View>
          <TouchableOpacity style={styles.viewBtn}>
            <ThemedText style={{ fontSize: 12, color: colors.tint, fontWeight: '600' }}>
              View
            </ThemedText>
            <Ionicons name="chevron-forward" size={12} color={colors.tint} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  studentCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 12,
  },
  studentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  studentAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '600',
  },
  studentInfo: {
    flex: 1,
  },
  studentDetails: {
    gap: 10,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  viewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
})