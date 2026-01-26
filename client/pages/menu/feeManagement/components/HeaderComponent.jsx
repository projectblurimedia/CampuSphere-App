import React, { useMemo } from 'react'
import {
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Animated,
} from 'react-native'
import { ThemedText } from '@/components/ui/themed-text'
import {
  Feather,
  MaterialIcons,
  MaterialCommunityIcons,
} from '@expo/vector-icons'
import AcademicYearDropdown from './AcademicYearDropdown'

const HeaderComponent = React.memo(({
  colors,
  searchQuery,
  handleSearch,
  activeTab,
  setActiveTab,
  selectedAcademicYear,
  handleYearSelect,
  filteredClassFees,
  filteredBusFees,
  filteredHostelFees,
  handleAddClassFee,
  handleAddBusFee,
  handleAddHostelFee,
  setShowUploadModal,
  searchInputRef,
  slideAnim,
  flatListRef
}) => {
  const styles = useMemo(() => {
    return StyleSheet.create({
      headerContainer: {
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        marginBottom: 8,
        backgroundColor: colors.cardBackground,
      },
      searchRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 16,
      },
      searchInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 14,
        paddingHorizontal: 16,
        height: 52,
        flex: 1,
      },
      searchIcon: {
        marginRight: 5,
      },
      searchInput: {
        flex: 1,
        height: '100%',
        fontSize: 14,
        fontFamily: 'Poppins-Medium',
        marginBottom: -3,
      },
      clearButton: {
        padding: 4,
      },
      tabsContainer: {
        marginBottom: 16,
        position: 'relative',
      },
      tabsWrapper: {
        flexDirection: 'row',
        borderRadius: 12,
        padding: 4,
        backgroundColor: colors.inputBackground,
      },
      tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 12,
        borderRadius: 8,
        position: 'relative',
      },
      activeTab: {
        backgroundColor: colors.background,
      },
      tabText: {
        fontSize: 13,
        fontFamily: 'Poppins-SemiBold',
      },
      tabBadge: {
        position: 'absolute',
        top: 6,
        right: 2,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 10,
        minWidth: 20,
        alignItems: 'center',
        justifyContent: 'center',
      },
      tabBadgeText: {
        fontSize: 10,
        fontFamily: 'Poppins-Bold',
      },
      tabIndicator: {
        position: 'absolute',
        bottom: 0,
        left: 4,
        width: '33.33%',
        height: 3,
        borderRadius: 1.5,
      },
      actionButtonsContainer: {
        marginBottom: 5,
      },
      actionButtonsRow: {
        flexDirection: 'row',
        alignItems: 'center',
      },
      actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
      },
      bulkUploadButton: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
      },
      actionButtonText: {
        fontSize: 14,
        fontFamily: 'Poppins-SemiBold',
      },
    })
  }, [colors])

  const handleClearSearch = () => {
    handleSearch('')
  }

  const getTabColor = (tab) => {
    switch(tab) {
      case 'class': return colors.primary
      case 'bus': return colors.success
      case 'hostel': return colors.warning
      default: return colors.primary
    }
  }

  const getTabIcon = (tab) => {
    switch(tab) {
      case 'class': return 'school'
      case 'bus': return 'directions-bus'
      case 'hostel': return 'apartment'
      default: return 'school'
    }
  }

  const getTabName = (tab) => {
    switch(tab) {
      case 'class': return 'Class'
      case 'bus': return 'Bus'
      case 'hostel': return 'Hostel'
      default: return 'Class'
    }
  }

  const getFilteredCount = (tab) => {
    switch(tab) {
      case 'class': return filteredClassFees.length
      case 'bus': return filteredBusFees.length
      case 'hostel': return filteredHostelFees.length
      default: return 0
    }
  }

  const getAddFunction = (tab) => {
    switch(tab) {
      case 'class': return handleAddClassFee
      case 'bus': return handleAddBusFee
      case 'hostel': return handleAddHostelFee
      default: return handleAddClassFee
    }
  }

  const tabs = ['class', 'bus', 'hostel']

  return (
    <View style={styles.headerContainer}>
      <View style={styles.searchRow}>
        <View style={[styles.searchInputContainer, { 
          backgroundColor: colors.inputBackground, 
          borderColor: getTabColor(activeTab) + '40',
        }]}>
          <Feather name="search" size={20} color={getTabColor(activeTab)} style={styles.searchIcon} />
          <TextInput
            ref={searchInputRef}
            placeholder={`Search ${activeTab} fees...`}
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={handleSearch}
            style={[styles.searchInput, { color: colors.text }]}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
          {searchQuery ? (
            <TouchableOpacity 
              activeOpacity={.9}
              onPress={handleClearSearch}
              style={styles.clearButton}
            >
              <Feather name="x-circle" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          ) : null}
        </View>
        
        <View style={{ flex: .7 }}>
          <AcademicYearDropdown
            selectedAcademicYear={selectedAcademicYear}
            onSelect={handleYearSelect}
            colors={colors}
          />
        </View>
      </View>
      
      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <View style={[styles.tabsWrapper, { backgroundColor: colors.inputBackground }]}>
          {tabs.map((tab) => (
            <TouchableOpacity 
              key={tab}
              activeOpacity={.9}
              style={[styles.tab, activeTab === tab && styles.activeTab]}
              onPress={() => {
                setActiveTab(tab)
                flatListRef.current?.scrollToOffset({ animated: true, offset: 0 })
              }}
            >
              <MaterialIcons 
                name={getTabIcon(tab)} 
                size={18} 
                color={activeTab === tab ? getTabColor(tab) : colors.textSecondary} 
              />
              <ThemedText style={[
                styles.tabText, 
                { color: activeTab === tab ? getTabColor(tab) : colors.textSecondary }
              ]}>
                {getTabName(tab)}
              </ThemedText>
              {getFilteredCount(tab) > 0 && (
                <View style={[styles.tabBadge, { backgroundColor: getTabColor(tab) + '20' }]}>
                  <ThemedText style={[styles.tabBadgeText, { color: getTabColor(tab) }]}>
                    {getFilteredCount(tab)}
                  </ThemedText>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
        
        {/* Animated indicator bar at bottom */}
        <Animated.View 
          style={[
            styles.tabIndicator,
            { 
              backgroundColor: getTabColor(activeTab),
              transform: [{
                translateX: slideAnim.interpolate({
                  inputRange: [0, 1, 2],
                  outputRange: [0, 126, 252]
                })
              }]
            }
          ]}
        />
      </View>
      
      <View style={styles.actionButtonsContainer}>
        <View style={styles.actionButtonsRow}>
          <TouchableOpacity 
            activeOpacity={.9}
            style={[
              styles.actionButton, 
              { 
                backgroundColor: getTabColor(activeTab) + '15', 
                borderColor: getTabColor(activeTab),
                flex: 1,
                marginRight: 8
              }
            ]}
            onPress={getAddFunction(activeTab)}
          >
            <Feather name="plus" size={18} color={getTabColor(activeTab)} />
            <ThemedText style={[styles.actionButtonText, { 
              color: getTabColor(activeTab)
            }]}>
              Add {getTabName(activeTab)}
            </ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity 
            activeOpacity={.9}
            style={[
              styles.bulkUploadButton,
              { 
                backgroundColor: getTabColor(activeTab) + '15',
                borderColor: getTabColor(activeTab)
              }
            ]}
            onPress={() => setShowUploadModal(true)}
          >
            <Feather name="upload" size={16} color={getTabColor(activeTab)} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )
})

export default HeaderComponent