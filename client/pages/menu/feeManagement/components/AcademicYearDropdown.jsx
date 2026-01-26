import React, { useState, useRef } from 'react'
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Platform,
} from 'react-native'
import { ThemedText } from '@/components/ui/themed-text'
import { Feather } from '@expo/vector-icons'
import { academicYears } from '../utils/classOrder'

const AcademicYearDropdown = React.memo(({ selectedAcademicYear, onSelect, colors }) => {
  const [showDropdown, setShowDropdown] = useState(false)
  const [dropdownPosition, setDropdownPosition] = useState({ x: 0, y: 0, width: 0 })
  const dropdownRef = useRef(null)

  const handleDropdownPress = () => {
    dropdownRef.current.measure((x, y, width, height, pageX, pageY) => {
      setDropdownPosition({
        x: pageX,
        y: pageY + height + 8,
        width: width
      })
      setShowDropdown(true)
    })
  }

  const handleYearSelect = (year) => {
    onSelect(year)
    setShowDropdown(false)
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        activeOpacity={.9}
        style={[styles.selector, { 
          backgroundColor: colors.inputBackground, 
          borderColor: colors.primary + '40' 
        }]}
        ref={dropdownRef}
        onPress={handleDropdownPress}
      >
        <Feather name="calendar" size={16} color={colors.primary} />
        <ThemedText style={[styles.selectedText, { color: colors.text }]}>
          {selectedAcademicYear}
        </ThemedText>
        <Feather 
          name={showDropdown ? "chevron-up" : "chevron-down"} 
          size={16} 
          color={colors.textSecondary} 
        />
      </TouchableOpacity>

      <Modal
        transparent={true}
        visible={showDropdown}
        animationType="fade"
        onRequestClose={() => setShowDropdown(false)}
        statusBarTranslucent={true}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setShowDropdown(false)}
        >
          <ScrollView style={[
            styles.dropdown,
            { 
              backgroundColor: colors.cardBackground,
              borderColor: colors.border,
              position: 'absolute',
              top: dropdownPosition.y,
              left: dropdownPosition.x,
              width: dropdownPosition.width,
              maxHeight: 300,
              borderRadius: 12,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.2,
              shadowRadius: 8,
              elevation: 5,
            }
          ]}>
            {academicYears.map((year, index) => (
              <TouchableOpacity
                key={year}
                activeOpacity={.9}
                style={[
                  styles.item,
                  index === academicYears.length - 1 ? {} : { borderBottomColor: colors.border + '50' },
                  selectedAcademicYear === year && { backgroundColor: colors.primary + '10' }
                ]}
                onPress={() => handleYearSelect(year)}
              >
                <ThemedText style={[
                  styles.itemText,
                  selectedAcademicYear === year && { color: colors.primary, fontFamily: 'Poppins-SemiBold' }
                ]}>
                  {year}
                </ThemedText>
                {selectedAcademicYear === year && (
                  <Feather name="check" size={16} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </TouchableOpacity>
      </Modal>
    </View>
  )
})

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 15,
    height: 52,
  },
  selectedText: {
    fontSize: 15,
    fontFamily: 'Poppins-Medium',
    flex: 1,
    marginLeft: 8,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  dropdown: {
    borderWidth: 1,
    maxHeight: 200,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  itemText: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
  },
})

export default AcademicYearDropdown