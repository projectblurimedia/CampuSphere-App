import React from 'react'
import {
  View,
  StyleSheet,
  TouchableOpacity,
} from 'react-native'
import { ThemedText } from '@/components/ui/themed-text'
import {
  Feather,
  MaterialIcons,
  MaterialCommunityIcons,
  FontAwesome5,
} from '@expo/vector-icons'

const HostelFeeCard = React.memo(({ item, onPress, colors }) => {
  // Calculate term amount if applicable
  const termAmount = item.totalAnnualFee / (item.totalTerms || 3)
  
  // Format hostel name display
  const formatHostelName = (name) => {
    if (!name) return 'Hostel'
    
    const str = name.toString()
    // Capitalize first letter of each word
    return str.replace(/\b\w/g, char => char.toUpperCase())
  }

  // Use warning color for hostel (similar to class using primary)
  const hostelColor = colors.warning

  return (
    <TouchableOpacity
      activeOpacity={.9}
      style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
      onPress={onPress}
    >
      <View style={styles.header}>
        <View style={[styles.icon, { backgroundColor: hostelColor + '20' }]}>
          <MaterialIcons name="apartment" size={24} color={hostelColor} />
        </View>
        <View style={styles.info}>
          <ThemedText style={styles.hostelName}>Hostel {formatHostelName(item.className)}</ThemedText>
          <View style={styles.metaRow}>
            <View style={[styles.badge, { backgroundColor: hostelColor + '10' }]}>
              <Feather name="calendar" size={10} color={hostelColor} />
              <ThemedText style={[styles.badgeText, { color: hostelColor }]}>
                {item.academicYear}
              </ThemedText>
            </View>
            <View style={[styles.badge, { backgroundColor: colors.info + '10' }]}>
              <MaterialCommunityIcons name="layers" size={10} color={colors.info} />
              <ThemedText style={[styles.badgeText, { color: colors.info }]}>
                {item.totalTerms || 3} Terms
              </ThemedText>
            </View>
            {!item.isActive && (
              <View style={[styles.badge, { backgroundColor: colors.error + '10' }]}>
                <Feather name="x-circle" size={10} color={colors.error} />
                <ThemedText style={[styles.badgeText, { color: colors.error }]}>
                  Inactive
                </ThemedText>
              </View>
            )}
          </View>
        </View>
        <View style={[styles.editIcon, { backgroundColor: hostelColor + '15' }]}>
          <Feather name="edit" size={16} color={hostelColor} />
        </View>
      </View>
      
      <View style={styles.feeContainer}>
        <View style={styles.column}>
          <ThemedText style={styles.feeLabel}>Annual Fee</ThemedText>
          <View style={styles.feeAmountRow}>
            <FontAwesome5 name="rupee-sign" size={12} color={hostelColor} />
            <ThemedText style={[styles.annualFee, { color: hostelColor }]}>
              {item.totalAnnualFee?.toLocaleString() || '0'}
            </ThemedText>
          </View>
        </View>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <View style={styles.column}>
          <ThemedText style={styles.feeLabel}>Per Term</ThemedText>
          <View style={styles.feeAmountRow}>
            <FontAwesome5 name="rupee-sign" size={12} color={colors.secondary} />
            <ThemedText style={[styles.termFee, { color: colors.secondary }]}>
              {termAmount.toLocaleString()}
            </ThemedText>
          </View>
        </View>
      </View>
      
      {item.description && (
        <View style={[styles.descriptionContainer, { backgroundColor: colors.inputBackground }]}>
          <Feather name="file-text" size={12} color={colors.textSecondary} />
          <ThemedText style={[styles.descriptionText, { color: colors.textSecondary }]} numberOfLines={1}>
            {item.description}
          </ThemedText>
        </View>
      )}
    </TouchableOpacity>
  )
})

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  icon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  hostelName: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontFamily: 'Poppins-Medium',
  },
  editIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  feeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  column: {
    flex: 1,
    alignItems: 'center',
  },
  divider: {
    width: 1,
    height: 30,
  },
  feeLabel: {
    fontSize: 11,
    fontFamily: 'Poppins-Medium',
    marginBottom: 4,
    color: '#666',
  },
  feeAmountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  annualFee: {
    fontSize: 16,
    fontFamily: 'Poppins-Bold',
  },
  termFee: {
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
  },
  
  descriptionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  descriptionText: {
    fontSize: 11,
    fontFamily: 'Poppins-Medium',
    flex: 1,
  },
})

export default HostelFeeCard