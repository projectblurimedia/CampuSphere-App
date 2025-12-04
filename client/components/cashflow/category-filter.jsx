import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native'
import { ThemedText } from '@/components/ui/themed-text'
import { Ionicons, MaterialIcons } from '@expo/vector-icons'

export default function CategoryFilter({ 
  categories, 
  selectedCategory, 
  setSelectedCategory, 
  colors, 
  dashboardColors 
}) {
  
  const getCategoryIcon = (category) => {
    switch(category) {
      case 'All':
        return <Ionicons name="grid" size={16} color={colors.text} />
      case 'Income':
        return <MaterialIcons name="trending-up" size={18} color={colors.text} />
      case 'Expenses':
        return <MaterialIcons name="trending-down" size={18} color={colors.text} />
      case 'Tuition':
        return <Ionicons name="school" size={16} color={colors.text} />
      case 'Salaries':
        return <Ionicons name="people" size={16} color={colors.text} />
      case 'Infrastructure':
        return <Ionicons name="construct" size={16} color={colors.text} />
      default:
        return <Ionicons name="card" size={16} color={colors.text} />
    }
  }
  
  const getCategoryColor = (category) => {
    switch(category) {
      case 'All':
        return colors.tint
      case 'Income':
        return dashboardColors.success
      case 'Expenses':
        return dashboardColors.danger
      case 'Tuition':
        return dashboardColors.info
      case 'Salaries':
        return dashboardColors.purple
      case 'Infrastructure':
        return dashboardColors.warning
      default:
        return dashboardColors.cyan
    }
  }

  return (
    <View style={styles.container}>
      <ScrollView 
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {categories.map(category => {
          const isSelected = selectedCategory === category
          const categoryColor = getCategoryColor(category)
          
          return (
            <TouchableOpacity 
              key={category}
              style={[
                styles.filterButton,
                { 
                  backgroundColor: isSelected ? categoryColor : dashboardColors.cardBg,
                  borderColor: dashboardColors.border
                }
              ]}
              onPress={() => setSelectedCategory(category)}
              activeOpacity={0.7}
            >
              {getCategoryIcon(category)}
              <ThemedText style={[
                styles.filterText,
                { 
                  color: isSelected ? '#fff' : colors.text,
                  marginLeft: 6
                }
              ]}>
                {category}
              </ThemedText>
            </TouchableOpacity>
          )
        })}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  scrollContent: {
    paddingHorizontal: 10,
    gap: 10,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
  },
})