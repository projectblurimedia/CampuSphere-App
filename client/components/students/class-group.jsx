import { View, StyleSheet, TouchableOpacity } from 'react-native'
import { ThemedText } from '@/components/ui/themed-text'
import { Ionicons } from '@expo/vector-icons'

export default function ClassGroup({ 
  className, 
  students, 
  isExpanded, 
  onToggle, 
  colors, 
  dashboardColors,
  searchQuery 
}) {
  
  const filteredStudents = searchQuery
    ? students.filter(student => 
        student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.rollNo.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : students

  return (
    <View 
      style={[styles.classGroup, { 
        backgroundColor: dashboardColors.cardBg,
        borderColor: dashboardColors.border,
        shadowColor: '#00000050'
      }]}
    >
      <TouchableOpacity 
        style={styles.classHeader}
        onPress={() => onToggle(className)}
        activeOpacity={0.7}
      >
        <View style={styles.classHeaderLeft}>
          <View style={[styles.classIcon, { backgroundColor: colors.tint + '15' }]}>
            <Ionicons name="school" size={18} color={colors.tint} />
          </View>
          <View>
            <ThemedText type="defaultSemiBold" style={{ color: colors.text, fontSize: 16 }}>
              {className}
            </ThemedText>
            <ThemedText style={{ color: colors.icon, fontSize: 12 }}>
              {filteredStudents.length} students
            </ThemedText>
          </View>
        </View>
        <Ionicons 
          name={isExpanded ? "chevron-up" : "chevron-down"} 
          size={20} 
          color={colors.icon} 
        />
      </TouchableOpacity>
      
      {isExpanded && filteredStudents.length > 0 && (
        <View style={styles.studentsList}>
          {filteredStudents.map(student => (
            <View key={student.id} style={styles.studentRow}>
              <View style={styles.studentRowLeft}>
                <View style={[styles.smallAvatar, { backgroundColor: colors.tint }]}>
                  <ThemedText style={[styles.smallAvatarText, { color: '#fff' }]}>
                    {student.name.charAt(0)}
                  </ThemedText>
                </View>
                <View>
                  <ThemedText style={{ color: colors.text, fontSize: 14, fontWeight: '500' }}>
                    {student.name}
                  </ThemedText>
                  <ThemedText style={{ color: colors.icon, fontSize: 12 }}>
                    {student.rollNo}
                  </ThemedText>
                </View>
              </View>
              <View style={styles.studentRowRight}>
                <View style={[styles.attendanceBadge, { 
                  backgroundColor: parseFloat(student.attendance) > 90 ? dashboardColors.success + '20' : dashboardColors.warning + '20' 
                }]}>
                  <ThemedText style={{ 
                    fontSize: 11, 
                    fontWeight: '600',
                    color: parseFloat(student.attendance) > 90 ? dashboardColors.success : dashboardColors.warning
                  }}>
                    {student.attendance}
                  </ThemedText>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.icon} />
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  classGroup: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  classHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  classHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  classIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  studentsList: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  studentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  studentRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  smallAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  smallAvatarText: {
    fontSize: 14,
    fontWeight: '600',
  },
  studentRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  attendanceBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
})