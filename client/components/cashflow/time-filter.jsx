import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native'
import { ThemedText } from '@/components/ui/themed-text'

export default function TimeFilter({ 
  timeFilters, 
  selectedFilter, 
  setSelectedFilter, 
  colors, 
  dashboardColors 
}) {
  return (
    <View style={styles.container}>
      <ScrollView 
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {timeFilters.map(filter => (
          <TouchableOpacity 
            key={filter.id}
            style={[
              styles.filterButton,
              { 
                backgroundColor: selectedFilter === filter.id ? colors.tint : 'transparent',
                borderColor: dashboardColors.border
              }
            ]}
            onPress={() => setSelectedFilter(filter.id)}
            activeOpacity={0.7}
          >
            <ThemedText style={[
              styles.filterText,
              { color: selectedFilter === filter.id ? '#fff' : colors.text }
            ]}>
              {filter.label}
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
    alignItems: 'center',
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
  },
})