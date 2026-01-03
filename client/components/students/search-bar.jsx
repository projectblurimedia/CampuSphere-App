import React, { useState } from 'react'
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  Pressable,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { ThemedText } from '@/components/ui/themed-text'
import { useTheme } from '@/hooks/useTheme'

export default function SearchBar({
  searchQuery,
  setSearchQuery,
  dashboardColors,
  filters: externalFilters,
  setFilters: externalSetFilters,
}) {
  const { colors } = useTheme()

  const [internalFilters, setInternalFilters] = useState({
    classFilter: 'All',
    genderFilter: 'All',
  })
  const [showFilterModal, setShowFilterModal] = useState(false)
  const [pendingFilters, setPendingFilters] = useState({
    classFilter: 'All',
    genderFilter: 'All',
  })

  const [showClassDropdown, setShowClassDropdown] = useState(false)

  const filters = externalFilters || internalFilters
  const setFilters = externalSetFilters || setInternalFilters

  const isFilterActive =
    filters.classFilter !== 'All' || filters.genderFilter !== 'All'

  const classes = [
    'All',
    'Pre Nursery',
    'Nursery',
    'LKG',
    'UKG',
    'Class 1',
    'Class 2',
    'Class 3',
    'Class 4',
    'Class 5',
    'Class 6',
    'Class 7',
    'Class 8',
    'Class 9',
    'Class 10',
    'Class 11',
    'Class 12',
  ]

  const genders = ['All', 'Male', 'Female']

  const openFilterModal = () => {
    setPendingFilters(filters)
    setShowClassDropdown(false)
    setShowFilterModal(true)
  }

  const handleGenderSelect = (selectedGender) => {
    setPendingFilters((prev) => ({ ...prev, genderFilter: selectedGender }))
  }

  const handleClassSelectInline = (selectedClass) => {
    setPendingFilters((prev) => ({ ...prev, classFilter: selectedClass }))
    setShowClassDropdown(false)
  }

  const handleClearFilters = () => {
    const cleared = {
      classFilter: 'All',
      genderFilter: 'All',
    }
    setPendingFilters(cleared)
    setFilters(cleared)
  }

  const handleOkPress = () => {
    setFilters(pendingFilters)
    setShowFilterModal(false)
    setShowClassDropdown(false)
  }

  const handleCloseModal = () => {
    setShowFilterModal(false)
    setShowClassDropdown(false)
  }

  return (
    <>
      {/* Top row: search + filter icon only */}
      <View style={styles.topRow}>
        {/* Search */}
        <View
          style={[
            styles.searchContainer,
            {
              backgroundColor: dashboardColors.inputBackground,
              borderColor: dashboardColors.border,
            },
          ]}
        >
          <Ionicons
            name="search"
            size={18}
            color={colors.textSecondary}
            style={styles.searchIcon}
          />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search by student name"
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            cursorColor="#1d9bf0"
            textAlignVertical="center"
          />
          {searchQuery ? (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              style={styles.clearButton}
            >
              <Ionicons
                name="close-circle"
                size={18}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Filter button, same height as input */}
        <TouchableOpacity
          onPress={openFilterModal}
          style={[
            styles.filterButtonStandalone,
            {
              backgroundColor: dashboardColors.inputBackground,
              borderColor: dashboardColors.border,
            },
          ]}
          activeOpacity={0.7}
        >
          <View style={styles.filterIconContainer}>
            <Ionicons
              name="options-outline"
              size={20}
              color={colors.textSecondary}
            />
            {isFilterActive && <View style={styles.filterDot} />}
          </View>
        </TouchableOpacity>
      </View>

      {/* Filter modal */}
      <Modal
        animationType="fade"
        transparent
        statusBarTranslucent
        visible={showFilterModal}
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalContainer}>
          <View
            style={[
              styles.filterModal,
              { backgroundColor: colors.cardBackground },
            ]}
          >
            <View
              style={[
                styles.modalHeader,
                { borderBottomColor: colors.border },
              ]}
            >
              <ThemedText
                type="subtitle"
                style={[styles.modalTitle, { color: colors.text }]}
              >
                Filters
              </ThemedText>
              <TouchableOpacity
                onPress={handleCloseModal}
                style={[
                  styles.closeButton,
                  { backgroundColor: colors.danger + '20' },
                ]}
              >
                <Ionicons name="close" size={24} color={colors.danger} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.filterContent}>
              {/* Class filter as dropdown (like old academic year) */}
              <View style={styles.filterSection}>
                <ThemedText
                  type="subtitle"
                  style={[styles.sectionTitle, { color: colors.text }]}
                >
                  Class:
                </ThemedText>

                {/* Dropdown trigger */}
                <Pressable
                  style={[
                    styles.dropdownSelector,
                    {
                      backgroundColor: dashboardColors.inputBackground,
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() => setShowClassDropdown((prev) => !prev)}
                >
                  <ThemedText
                    style={[
                      styles.dropdownValue,
                      {
                        color:
                          pendingFilters.classFilter === 'All'
                            ? colors.textSecondary
                            : colors.text,
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {pendingFilters.classFilter}
                  </ThemedText>
                  <Ionicons
                    name={showClassDropdown ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color={colors.textSecondary}
                  />
                </Pressable>

                {/* Dropdown list inline inside modal */}
                {showClassDropdown && (
                  <View
                    style={[
                      styles.dropdownList,
                      {
                        backgroundColor: colors.cardBackground,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <ScrollView nestedScrollEnabled>
                      {classes.map((cls) => (
                        <Pressable
                          key={cls}
                          style={[
                            styles.dropdownItem,
                            {
                              backgroundColor:
                                pendingFilters.classFilter === cls
                                  ? `${colors.primary}18`
                                  : 'transparent',
                            },
                          ]}
                          onPress={() => handleClassSelectInline(cls)}
                        >
                          <ThemedText
                            style={[
                              styles.dropdownItemText,
                              {
                                color:
                                  pendingFilters.classFilter === cls
                                    ? colors.primary
                                    : colors.text,
                              },
                            ]}
                          >
                            {cls}
                          </ThemedText>
                        </Pressable>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>

              {/* Gender filter */}
              <View style={[styles.filterSection, { marginTop: 24 }]}>
                <ThemedText
                  type="subtitle"
                  style={[styles.sectionTitle, { color: colors.text }]}
                >
                  Gender:
                </ThemedText>
                <View style={styles.optionsContainer}>
                  {genders.map((gender) => (
                    <TouchableOpacity
                      key={gender}
                      style={[
                        styles.optionButton,
                        {
                          backgroundColor:
                            pendingFilters.genderFilter === gender
                              ? `${colors.primary}20`
                              : 'transparent',
                          borderColor:
                            pendingFilters.genderFilter === gender
                              ? colors.primary
                              : colors.border,
                          borderWidth:
                            pendingFilters.genderFilter === gender ? 2 : 1,
                        },
                      ]}
                      activeOpacity={0.7}
                      onPress={() => handleGenderSelect(gender)}
                    >
                      <ThemedText
                        style={[
                          styles.optionText,
                          {
                            color:
                              pendingFilters.genderFilter === gender
                                ? colors.primary
                                : colors.text,
                          },
                        ]}
                      >
                        {gender}
                      </ThemedText>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>

            <View style={[styles.footer, { borderTopColor: colors.border }]}>
              <TouchableOpacity
                style={[styles.footerButton, styles.clearButtonStyle]}
                activeOpacity={0.7}
                onPress={handleClearFilters}
              >
                <ThemedText
                  style={[
                    styles.footerButtonText,
                    { color: colors.textSecondary },
                  ]}
                >
                  Clear All
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.footerButton, styles.okButtonStyle]}
                activeOpacity={0.7}
                onPress={handleOkPress}
              >
                <ThemedText
                  style={[
                    styles.footerButtonText,
                    { color: 'white', fontWeight: '600' },
                  ]}
                >
                  OK
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  )
}

const styles = StyleSheet.create({
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 15,
    marginBottom: 5,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 0,
    paddingHorizontal: 0,
    lineHeight: 20,
    fontWeight: '500',
  },
  clearButton: {
    padding: 4,
    marginLeft: 6,
  },

  // Filter button same height as search input
  filterButtonStandalone: {
    marginLeft: 10,
    height: 48,
    width: 48,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterIconContainer: {
    position: 'relative',
  },
  filterDot: {
    position: 'absolute',
    top: -3,
    right: -3,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#f59e0b',
  },

  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  filterModal: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '75%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 22,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterContent: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 20,
  },
  filterSection: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 16,
  },

  // Generic dropdown styles (used for class)
  dropdownSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    height: 54,
    borderRadius: 30,
    borderWidth: 1,
    justifyContent: 'space-between',
  },
  dropdownValue: {
    fontSize: 15,
    marginRight: 8,
    flex: 1,
  },
  dropdownList: {
    marginTop: 6,
    width: '100%',
    maxHeight: 220,
    borderRadius: 36,
    borderWidth: 1,
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  dropdownItemText: {
    fontSize: 15,
  },

  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 10,
  },
  optionButton: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 24,
    minWidth: 85,
    alignItems: 'center',
  },
  optionText: {
    fontSize: 15,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 20,
    borderTopWidth: 1,
    marginHorizontal: 24,
  },
  footerButton: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearButtonStyle: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: 'transparent',
  },
  okButtonStyle: {
    backgroundColor: '#1d9bf0',
  },
  footerButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
})
