import { StyleSheet, View, TextInput, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

export default function StaffSearchBar({ 
  searchQuery, 
  setSearchQuery, 
  colors, 
  dashboardColors 
}) {
  return (
    <View style={[styles.searchContainer, { 
      backgroundColor: dashboardColors.cardBg, 
      borderColor: dashboardColors.border 
    }]}>
      <Ionicons name="search" size={20} color={colors.icon} style={styles.searchIcon} />
      <TextInput
        style={[styles.searchInput, { color: colors.text }]}
        placeholder="Search by name and department..."
        placeholderTextColor={colors.icon}
        value={searchQuery}
        onChangeText={setSearchQuery}
      />
      {searchQuery ? (
        <TouchableOpacity onPress={() => setSearchQuery('')}>
          <Ionicons name="close-circle" size={20} color={colors.icon} />
        </TouchableOpacity>
      ) : (
        <Ionicons name="options-outline" size={20} color={colors.icon} />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    padding: 0,
    paddingVertical: 2,
    lineHeight: 20,
  },
})