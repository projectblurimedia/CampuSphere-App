import { View, StyleSheet, TouchableOpacity } from 'react-native'
import { ThemedText } from '@/components/ui/themed-text'
import { Ionicons, FontAwesome5, MaterialIcons } from '@expo/vector-icons'

export default function StaffCard({ staff, colors, dashboardColors }) {
  
  const getStaffIcon = (type) => {
    switch(type) {
      case 'Teaching':
        return <FontAwesome5 name="chalkboard-teacher" size={18} color="#fff" />
      case 'Non-Teaching':
        return <MaterialIcons name="admin-panel-settings" size={20} color="#fff" />
      default:
        return <Ionicons name="person" size={18} color="#fff" />
    }
  }
  
  const getTypeColor = (type) => {
    switch(type) {
      case 'Teaching':
        return dashboardColors.info
      case 'Non-Teaching':
        return dashboardColors.success
      default:
        return dashboardColors.purple
    }
  }
  
  const getStatusColor = (status) => {
    switch(status) {
      case 'Present':
        return dashboardColors.success
      case 'Absent':
        return dashboardColors.danger
      case 'On Leave':
        return dashboardColors.warning
      default:
        return dashboardColors.info
    }
  }

  const typeColor = getTypeColor(staff.type)
  const statusColor = getStatusColor(staff.status)

  return (
    <View style={[styles.staffCard, { 
      backgroundColor: dashboardColors.cardBg, 
      borderColor: dashboardColors.border,
      shadowColor: '#00000040'
    }]}>
      <View style={styles.staffHeader}>
        <View style={[styles.staffAvatar, { backgroundColor: typeColor }]}>
          {getStaffIcon(staff.type)}
        </View>
        <View style={styles.staffInfo}>
          <ThemedText type="defaultSemiBold" style={{ color: colors.text, fontSize: 15 }}>
            {staff.name}
          </ThemedText>
          <ThemedText style={{ color: colors.icon, fontSize: 12 }}>
            {staff.designation}
          </ThemedText>
        </View>
      </View>
      
      <View style={styles.staffDetails}>
        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <Ionicons name="business-outline" size={14} color={colors.icon} />
            <ThemedText style={{ color: colors.icon, fontSize: 12, marginLeft: 6 }}>
              {staff.department}
            </ThemedText>
          </View>
          <View style={[styles.statusBadge, { 
            backgroundColor: statusColor + '20' 
          }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <ThemedText style={{ 
              fontSize: 11, 
              fontWeight: '600',
              color: statusColor,
              marginLeft: 4
            }}>
              {staff.status}
            </ThemedText>
          </View>
        </View>
        
        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <Ionicons name="call-outline" size={14} color={colors.icon} />
            <ThemedText style={{ color: colors.icon, fontSize: 12, marginLeft: 6 }}>
              {staff.contact}
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
  staffCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 12,
  },
  staffHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  staffAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  staffInfo: {
    flex: 1,
  },
  staffDetails: {
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  viewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
})