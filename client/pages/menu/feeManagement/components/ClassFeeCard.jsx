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
  FontAwesome5,
} from '@expo/vector-icons'

const CLASS_LABELS = {
  'PRE_NURSERY': 'Pre-Nursery',
  'NURSERY': 'Nursery',
  'LKG': 'LKG',
  'UKG': 'UKG',
  'CLASS_1': '1',
  'CLASS_2': '2',
  'CLASS_3': '3',
  'CLASS_4': '4',
  'CLASS_5': '5',
  'CLASS_6': '6',
  'CLASS_7': '7',
  'CLASS_8': '8',
  'CLASS_9': '9',
  'CLASS_10': '10',
  'CLASS_11': '11',
  'CLASS_12': '12'
}

const ClassFeeCard = React.memo(({ item, onPress, colors }) => {
  const getClassLabel = (className) => {
    return CLASS_LABELS[className] || className || 'Class'
  }

  return (
    <TouchableOpacity
      activeOpacity={.9}
      style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
      onPress={onPress}
    >
      <View style={styles.header}>
        <View style={[styles.icon, { backgroundColor: colors.primary + '20' }]}>
          <MaterialIcons name="school" size={24} color={colors.primary} />
        </View>
        <View style={styles.info}>
          <ThemedText style={styles.className}>
            {getClassLabel(item.className)}
          </ThemedText>
          <View style={styles.metaRow}>
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
        <View style={[styles.editIcon, { backgroundColor: colors.primary + '15' }]}>
          <Feather name="edit" size={16} color={colors.primary} />
        </View>
      </View>
      
      <View style={styles.feeContainer}>
        <View style={[styles.feeMainRow, { backgroundColor: colors.inputBackground }]}>
          <View style={styles.feeInfoRow}>
            <FontAwesome5 name="rupee-sign" size={14} color={colors.textSecondary} />
            <ThemedText style={[styles.feeLabel, { color: colors.textSecondary }]}>
              Annual Fee:
            </ThemedText>
          </View>
          <ThemedText style={[styles.annualFee, { color: colors.primary }]}>
            ₹{item.totalAnnualFee?.toLocaleString() || '0'}
          </ThemedText>
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
  className: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  feeContainer: {
    marginBottom: 8,
  },
  feeMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  feeInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  feeLabel: {
    fontSize: 13,
    fontFamily: 'Poppins-Medium',
  },
  annualFee: {
    fontSize: 16,
    fontFamily: 'Poppins-Bold',
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

export default ClassFeeCard