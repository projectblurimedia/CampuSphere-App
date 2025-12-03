import { View, StyleSheet, TouchableOpacity } from 'react-native'
import { ThemedText } from '@/components/themed-text'
import { Ionicons } from '@expo/vector-icons'

export default function StudentsHeader({ colors, dashboardColors }) {
  return (
    <View style={[styles.header, { backgroundColor: colors.background }]}>
      <View style={styles.headerContent}>
        <View style={styles.headerTextContainer}>
          <ThemedText type="title" style={styles.headerTitle}>Students</ThemedText>
          <ThemedText style={[styles.headerSubtitle, { color: colors.icon }]}>
            Manage and view student details
          </ThemedText>
        </View>
        
        <TouchableOpacity 
          style={[styles.addBtn, { backgroundColor: colors.tint }]}
          activeOpacity={0.8}
        >
          <ThemedText style={styles.addBtnText}>Add</ThemedText>
          <Ionicons name="person-add" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 5,
    paddingBottom: 15,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    opacity: 0.9,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 14,
    opacity: 0.8,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  addBtnText: {
    color: '#fff',
    fontSize: 14,
  },
})