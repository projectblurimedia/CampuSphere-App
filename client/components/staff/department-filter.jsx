import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native'
import { ThemedText } from '@/components/ui/themed-text'
import { useTheme } from '@/hooks/useTheme'

export default function DepartmentFilter({ 
  departments, 
  selectedDepartment, 
  setSelectedDepartment, 
  dashboardColors 
}) {
  const { colors } = useTheme()
  
  return (
    <View style={styles.container}>
      <ScrollView 
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <TouchableOpacity 
          style={[
            styles.filterButton,
            { 
              backgroundColor: selectedDepartment === 'All' ? colors.tint : dashboardColors.cardBg,
              borderColor: dashboardColors.border
            }
          ]}
          onPress={() => setSelectedDepartment('All')}
          activeOpacity={0.7}
        >
          <ThemedText style={[
            styles.filterText,
            { color: selectedDepartment === 'All' ? '#fff' : colors.text }
          ]}>
            All
          </ThemedText>
        </TouchableOpacity>
        
        {departments.map(dept => (
          <TouchableOpacity 
            key={dept}
            style={[
              styles.filterButton,
              { 
                backgroundColor: selectedDepartment === dept ? colors.tint : dashboardColors.cardBg,
                borderColor: dashboardColors.border
              }
            ]}
            onPress={() => setSelectedDepartment(dept)}
            activeOpacity={0.7}
          >
            <ThemedText style={[
              styles.filterText,
              { color: selectedDepartment === dept ? '#fff' : colors.text }
            ]}>
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
    marginBottom: 20,
  },
  scrollContent: {
    paddingHorizontal: 10,
    gap: 10,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    minWidth: 80,
    alignItems: 'center',
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
  },
})