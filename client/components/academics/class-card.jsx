import { View, StyleSheet, TouchableOpacity } from 'react-native'
import { ThemedText } from '@/components/ui/themed-text'
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons'

export default function ClassCard({ classData, colors, dashboardColors }) {
  const { 
    id, 
    className, 
    grade, 
    section, 
    totalStudents, 
    classTeacher, 
    subjects, 
    room 
  } = classData

  const subjectsCount = subjects?.length || 0
  
  return (
    <TouchableOpacity 
      style={[styles.card, { 
        backgroundColor: colors.card,
        borderColor: dashboardColors.border 
      }]}
      activeOpacity={0.8}
    >
      <View style={styles.cardHeader}>
        <View style={styles.classInfo}>
          <View style={styles.classBadge}>
            <MaterialIcons name="class" size={18} color={dashboardColors.info} />
            <ThemedText style={[styles.className, { color: colors.text }]}>
              {className}
            </ThemedText>
          </View>
          <ThemedText style={[styles.gradeSection, { color: colors.icon }]}>
            {grade} • Section {section}
          </ThemedText>
        </View>
        
        <View style={styles.statusBadge}>
          <ThemedText style={styles.statusText}>Active</ThemedText>
        </View>
      </View>

      <View style={styles.cardContent}>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <FontAwesome5 name="user-graduate" size={14} color={dashboardColors.success} />
            <ThemedText style={[styles.statText, { color: colors.text }]}>
              {totalStudents} students
            </ThemedText>
          </View>
          
          <View style={styles.statItem}>
            <MaterialIcons name="menu-book" size={16} color={dashboardColors.warning} />
            <ThemedText style={[styles.statText, { color: colors.text }]}>
              {subjectsCount} subjects
            </ThemedText>
          </View>
        </View>

        <View style={styles.teacherInfo}>
          <MaterialIcons name="person" size={16} color={dashboardColors.purple} />
          <ThemedText style={[styles.teacherText, { color: colors.icon }]}>
            Class Teacher: {classTeacher}
          </ThemedText>
        </View>

        <View style={styles.roomInfo}>
          <MaterialIcons name="meeting-room" size={16} color={dashboardColors.info} />
          <ThemedText style={[styles.roomText, { color: colors.icon }]}>
            Room: {room}
          </ThemedText>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <TouchableOpacity style={styles.actionBtn}>
          <ThemedText style={styles.actionText}>View Details</ThemedText>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionBtn}>
          <ThemedText style={styles.actionText}>View Timetable</ThemedText>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  classInfo: {
    flex: 1,
  },
  classBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  className: {
    fontSize: 18,
    fontWeight: '700',
  },
  gradeSection: {
    fontSize: 14,
    opacity: 0.8,
  },
  statusBadge: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#22c55e',
    fontSize: 12,
    fontWeight: '600',
  },
  cardContent: {
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 13,
    opacity: 0.9,
  },
  teacherInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  teacherText: {
    fontSize: 13,
    opacity: 0.8,
  },
  roomInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  roomText: {
    fontSize: 13,
    opacity: 0.8,
  },
  cardFooter: {
    flexDirection: 'row',
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    alignItems: 'center',
  },
  actionText: {
    color: '#3b82f6',
    fontSize: 13,
    fontWeight: '600',
  },
})