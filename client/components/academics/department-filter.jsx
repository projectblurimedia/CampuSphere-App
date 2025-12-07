import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native'
import { ThemedText } from '@/components/ui/themed-text'

export default function DepartmentFilter({ 
  departments, 
  selectedDepartment, 
  setSelectedDepartment, 
  colors, 
  dashboardColors 
}) {
  return (
    <View style={[styles.container]}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <TouchableOpacity
          style={[
            styles.filterButton,
            { 
              backgroundColor: selectedDepartment === 'All' ? dashboardColors.info : colors.card,
              borderColor: dashboardColors.border 
            }
          ]}
          onPress={() => setSelectedDepartment('All')}
        >
          <ThemedText 
            style={[
              styles.filterText, 
              { color: selectedDepartment === 'All' ? '#fff' : colors.text }
            ]}
          >
            All
          </ThemedText>
        </TouchableOpacity>

        {departments.map((dept, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.filterButton,
              { 
                backgroundColor: selectedDepartment === dept ? dashboardColors.info : colors.card,
                borderColor: dashboardColors.border 
              }
            ]}
            onPress={() => setSelectedDepartment(dept)}
          >
            <ThemedText 
              style={[
                styles.filterText, 
                { color: selectedDepartment === dept ? '#fff' : colors.text }
              ]}
            >
              {dept}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
  },
  scrollContent: {
    paddingVertical: 4,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
  },
})