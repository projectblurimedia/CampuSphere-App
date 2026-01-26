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

const BusFeeCard = React.memo(({ item, onPress, colors }) => {
  return (
    <TouchableOpacity
      activeOpacity={.9}
      style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
      onPress={onPress}
    >
      <View style={styles.header}>
        <View style={[styles.icon, { backgroundColor: colors.success + '20' }]}>
          <MaterialIcons name="directions-bus" size={24} color={colors.success} />
        </View>
        <View style={styles.info}>
          <ThemedText style={styles.village}>{item.villageName}</ThemedText>
          <View style={styles.meta}>
            <View style={[styles.badge, { backgroundColor: colors.success + '10' }]}>
              <Feather name="map-pin" size={10} color={colors.success} />
              <ThemedText style={[styles.badgeText, { color: colors.success }]}>
                {item.distance} km
              </ThemedText>
            </View>
            <View style={[styles.badge, { backgroundColor: colors.warning + '10' }]}>
              <MaterialIcons name="directions-car" size={10} color={colors.warning} />
              <ThemedText style={[styles.badgeText, { color: colors.warning }]}>
                {item.vehicleType || 'Bus'}
              </ThemedText>
            </View>
            <View style={[styles.badge, { backgroundColor: colors.info + '10' }]}>
              <Feather name="calendar" size={10} color={colors.info} />
              <ThemedText style={[styles.badgeText, { color: colors.info }]}>
                {item.academicYear}
              </ThemedText>
            </View>
          </View>
        </View>
        <View style={[styles.editIcon, { backgroundColor: colors.success + '15' }]}>
          <Feather name="edit" size={16} color={colors.success} />
        </View>
      </View>
      
      <View style={[styles.feeContainer, { backgroundColor: colors.inputBackground }]}>
        <View style={styles.feeInfoRow}>
          <FontAwesome5 name="rupee-sign" size={14} color={colors.textSecondary} />
          <ThemedText style={[styles.feeLabel, { color: colors.textSecondary }]}>
            Bus Fee:
          </ThemedText>
        </View>
        <ThemedText style={styles.feeAmount}>₹{item.feeAmount?.toLocaleString() || '0'}</ThemedText>
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
  village: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    marginBottom: 8,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
    justifyContent: 'space-between',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
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
  feeAmount: {
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

export default BusFeeCard