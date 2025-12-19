import React, { useMemo } from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native'
import { ThemedText } from '@/components/ui/themed-text'
import { ThemedInput } from '@/components/ui/themed-input'
import {
  FontAwesome5,
  MaterialCommunityIcons,
  Feather,
} from '@expo/vector-icons'

const sectionColors = [
  '#3b82f6', // Basic Info - Blue
  '#10b981', // Administration - Green
  '#9115ba', // Contact Info - Purple
  '#e00303', // Timings - Red
  '#8b5cf6', // Facilities - Violet
  '#06b6d4', // Additional Info - Cyan
  '#e38800', // Mission - Orange
  '#f63bd7', // Vision - Pink
]

const SchoolInfo = ({ schoolInfo, isEditing, onInputChange, colors }) => {
  const sections = [
    {
      title: 'Basic Information',
      color: sectionColors[0],
      icon: <MaterialCommunityIcons name="information" size={20} color={sectionColors[0]} />,
      fields: [
        {
          label: 'School Name',
          value: schoolInfo.name,
          key: 'name',
          icon: <FontAwesome5 name="school" size={16} color={sectionColors[0]} />
        },
        {
          label: 'Motto',
          value: schoolInfo.motto,
          key: 'motto',
          icon: <FontAwesome5 name="quote-right" size={16} color={sectionColors[0]} />
        },
        {
          label: 'Established',
          value: schoolInfo.establishedYear,
          key: 'establishedYear',
          icon: <FontAwesome5 name="calendar-alt" size={16} color={sectionColors[0]} />
        },
        {
          label: 'Affiliation',
          value: schoolInfo.affiliation,
          key: 'affiliation',
          icon: <MaterialCommunityIcons name="certificate" size={16} color={sectionColors[0]} />
        },
        {
          label: 'Board',
          value: schoolInfo.board,
          key: 'board',
          icon: <Feather name="award" size={16} color={sectionColors[0]} />
        }
      ]
    },
    {
      title: 'Administration',
      color: sectionColors[1],
      icon: <MaterialCommunityIcons name="account-tie" size={20} color={sectionColors[1]} />,
      groups: [
        {
          groupTitle: 'Principal',
          fields: [
            {
              label: 'Name',
              value: schoolInfo.principal,
              key: 'principal',
              icon: <MaterialCommunityIcons name="account-tie" size={16} color={sectionColors[1]} />
            },
            {
              label: 'Email',
              value: schoolInfo.principalEmail,
              key: 'principalEmail',
              icon: <Feather name="mail" size={16} color={sectionColors[1]} />
            },
            {
              label: 'Phone',
              value: schoolInfo.principalPhone,
              key: 'principalPhone',
              icon: <Feather name="phone" size={16} color={sectionColors[1]} />
            }
          ]
        },
        {
          groupTitle: 'Vice Principal',
          fields: [
            {
              label: 'Name',
              value: schoolInfo.vicePrincipal,
              key: 'vicePrincipal',
              icon: <MaterialCommunityIcons name="account-tie-hat" size={16} color={sectionColors[1]} />
            },
            {
              label: 'Email',
              value: schoolInfo.vicePrincipalEmail,
              key: 'vicePrincipalEmail',
              icon: <Feather name="mail" size={16} color={sectionColors[1]} />
            },
            {
              label: 'Phone',
              value: schoolInfo.vicePrincipalPhone,
              key: 'vicePrincipalPhone',
              icon: <Feather name="phone" size={16} color={sectionColors[1]} />
            }
          ]
        }
      ]
    },
    {
      title: 'Contact Information',
      color: sectionColors[2],
      icon: <Feather name="phone" size={20} color={sectionColors[2]} />,
      fields: [
        {
          label: 'Location',
          value: schoolInfo.address,
          key: 'address',
          icon: <Feather name="map-pin" size={16} color={sectionColors[2]} />,
          type: 'multiline'
        },
        {
          label: 'Email',
          value: schoolInfo.email,
          key: 'email',
          icon: <Feather name="mail" size={16} color={sectionColors[2]} />
        },
        {
          label: 'Phone',
          value: schoolInfo.phone,
          key: 'phone',
          icon: <Feather name="phone" size={16} color={sectionColors[2]} />
        },
        {
          label: 'Website',
          value: schoolInfo.website,
          key: 'website',
          icon: <Feather name="globe" size={16} color={sectionColors[2]} />
        }
      ]
    },
    {
      title: 'School Timings',
      color: sectionColors[3],
      icon: <Feather name="clock" size={20} color={sectionColors[3]} />,
      fields: [
        {
          label: 'School Hours',
          value: schoolInfo.schoolHours,
          key: 'schoolHours',
          icon: <Feather name="clock" size={16} color={sectionColors[3]} />
        },
        {
          label: 'Office Hours',
          value: schoolInfo.officeHours,
          key: 'officeHours',
          icon: <Feather name="briefcase" size={16} color={sectionColors[3]} />
        },
        {
          label: 'Working Days',
          value: schoolInfo.workingDays,
          key: 'workingDays',
          icon: <Feather name="calendar" size={16} color={sectionColors[3]} />
        },
        {
          label: 'Assembly Time',
          value: schoolInfo.assemblyTime,
          key: 'assemblyTime',
          icon: <Feather name="bell" size={16} color={sectionColors[3]} />
        }
      ]
    },
    {
      title: 'Facilities',
      color: sectionColors[4],
      icon: <MaterialCommunityIcons name="home-group" size={20} color={sectionColors[4]} />,
      fields: [
        {
          label: 'Available Facilities',
          value: schoolInfo.facilities,
          key: 'facilities',
          icon: <MaterialCommunityIcons name="home-group" size={16} color={sectionColors[4]} />,
          type: 'multiline'
        }
      ]
    },
    {
      title: 'Mission',
      color: sectionColors[6],
      icon: <MaterialCommunityIcons name="bullseye-arrow" size={20} color={sectionColors[6]} />,
      fields: [
        {
          label: '',
          value: schoolInfo.mission,
          key: 'mission',
          type: 'multiline'
        }
      ]
    },
    {
      title: 'Vision',
      color: sectionColors[7],
      icon: <MaterialCommunityIcons name="eye" size={20} color={sectionColors[7]} />,
      fields: [
        {
          label: '',
          value: schoolInfo.vision,
          key: 'vision',
          type: 'multiline'
        }
      ]
    },
    {
      title: 'Additional Information',
      color: sectionColors[5],
      icon: <Feather name="info" size={20} color={sectionColors[5]} />,
      fields: [
        {
          label: 'Campus Area',
          value: schoolInfo.campusArea,
          key: 'campusArea',
          icon: <FontAwesome5 name="mountain" size={16} color={sectionColors[5]} />
        },
        {
          label: 'Library Books',
          value: schoolInfo.libraryBooks,
          key: 'libraryBooks',
          icon: <FontAwesome5 name="book" size={16} color={sectionColors[5]} />
        },
        {
          label: 'Computer Systems',
          value: schoolInfo.computerSystems,
          key: 'computerSystems',
          icon: <FontAwesome5 name="desktop" size={16} color={sectionColors[5]} />
        }
      ]
    },
  ]

  const styles = useMemo(() => StyleSheet.create({
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingBottom: 120,
    },
    content: {
      padding: 16,
      paddingTop: 8,
    },
    sectionContainer: {
      borderRadius: 18,
      padding: 16,
      marginBottom: 16,
      backgroundColor: colors.cardBackground,
      borderWidth: 1,
      borderColor: colors.border,
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
        },
        android: {
          elevation: 3,
        },
      }),
    },
    sectionHeader: {
      marginBottom: 20,
    },
    sectionTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
      gap: 10,
      padding: 12,
      borderRadius: 12,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
    },
    sectionDivider: {
      height: 1,
      opacity: 0.3,
    },
    sectionContent: {
      gap: 16,
    },
    adminGroup: {
      marginBottom: 20,
      gap: 20,
    },
    groupTitle: {
      fontSize: 18,
      paddingBottom: 8,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(0, 0, 0, 0.1)',
      letterSpacing: 0.5,
    },
    fieldContainer: {
      gap: 8,
    },
    fieldLabelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    fieldIcon: {
      width: 28,
      height: 28,
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
    },
    fieldLabel: {
      fontSize: 13,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    fieldInput: {
      fontSize: 15,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 12,
      borderWidth: 1,
    },
    multilineInput: {
      minHeight: 80,
      textAlignVertical: 'top',
      paddingVertical: 12,
    },
    displayCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.cardBackground,
      borderRadius: 4,
      borderTopRightRadius: 12,
      borderBottomRightRadius: 12,
      padding: 12,
      borderLeftWidth: 3,
      marginBottom: 4,
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        android: {
          elevation: .5,
        },
      }),
    },
    displayIcon: {
      width: 42,
      height: 42,
      borderRadius: 18,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    displayContent: {
      flex: 1,
      gap: 2,
    },
    displayTitle: {
      fontSize: 12,
      color: colors.textSecondary,
      lineHeight: 18,
    },
    displayValue: {
      fontSize: 14,
      color: colors.text,
      lineHeight: 20,
    },
    facilitiesGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      alignItems: 'flex-start',
    },
    facilityTag: {
      backgroundColor: colors.primary + '10',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.primary + '20',
      marginBottom: 6,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 36,
    },
    facilityText: {
      fontSize: 13,
      color: colors.primary,
      fontWeight: '500',
      textAlign: 'center',
    },
  }), [colors])

  const renderDisplayField = (fieldConfig, sectionColor) => {
    const { label, value, key, icon: fieldIcon, type = 'text' } = fieldConfig
    
    if (!value && value !== 0) {
      return null
    }

    const fieldIconElement = fieldIcon ? React.cloneElement(fieldIcon, { color: 'white' }) : null
    const displayStyle = {
      borderLeftColor: sectionColor,
      backgroundColor: sectionColor + '08',
    }

    if (type === 'multiline' && label === 'Available Facilities') {
      const facilities = value.split(', ').map(facility => facility.trim())
      return (
        <View key={key} style={[styles.displayCard, displayStyle, { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 16 }]}>
          {fieldIconElement && (
            <View style={[styles.displayIcon, { backgroundColor: sectionColor, marginBottom: 12 }]}>
              {fieldIconElement}
            </View>
          )}
          <View style={styles.displayContent}>
            {label && (
              <ThemedText style={[styles.displayTitle, { marginBottom: 8 }]}>{label}</ThemedText>
            )}
            <View style={styles.facilitiesGrid}>
              {facilities.map((facility, idx) => (
                <View key={idx} style={styles.facilityTag}>
                  <ThemedText style={styles.facilityText}>{facility}</ThemedText>
                </View>
              ))}
            </View>
          </View>
        </View>
      )
    }

    if (type === 'multiline') {
      return (
        <View key={key} style={[styles.displayCard, displayStyle, { flexDirection: 'row', alignItems: 'flex-start' }]}>
          {fieldIconElement && (
            <View style={[styles.displayIcon, { backgroundColor: sectionColor, marginBottom: 8 }]}>
              {fieldIconElement}
            </View>
          )}
          <View style={styles.displayContent}>
            {label && (
              <ThemedText style={[styles.displayTitle, { marginBottom: 4 }]}>{label}</ThemedText>
            )}
            <ThemedText style={[styles.displayValue]}>{value}</ThemedText>
          </View>
        </View>
      )
    }

    return (
      <View key={key} style={[styles.displayCard, displayStyle]}>
        {fieldIconElement && (
          <View style={[styles.displayIcon, { backgroundColor: sectionColor }]}>
            {fieldIconElement}
          </View>
        )}
        <View style={styles.displayContent}>
          {label && (
            <ThemedText style={[styles.displayTitle]}>{label}</ThemedText>
          )}
          <ThemedText style={[styles.displayValue]} numberOfLines={2}>{value}</ThemedText>
        </View>
      </View>
    )
  }

  const renderEditField = (fieldConfig, sectionColor) => {
    const { label, value, key, icon: fieldIcon, type = 'text' } = fieldConfig
    
    if (!value && value !== 0) {
      return null
    }

    const fieldIconElement = fieldIcon ? React.cloneElement(fieldIcon, { color: sectionColor }) : null
    const fieldLabelRow = label ? (
      <View style={styles.fieldLabelRow}>
        {fieldIconElement && (
          <View style={[styles.fieldIcon, { backgroundColor: sectionColor + '15' }]}>
            {fieldIconElement}
          </View>
        )}
        <ThemedText type='subtitle' style={[styles.fieldLabel, { color: colors.textSecondary }]}>
          {label}
        </ThemedText>
      </View>
    ) : null

    return (
      <View key={key} style={styles.fieldContainer}>
        {fieldLabelRow}
        <ThemedInput
          value={value}
          onChangeText={(text) => onInputChange(key, text)}
          multiline={type === 'multiline'}
          numberOfLines={type === 'multiline' ? 3 : 1}
          style={[
            styles.fieldInput,
            type === 'multiline' && styles.multilineInput,
            { 
              color: colors.text,
              backgroundColor: colors.inputBackground,
              borderColor: colors.border,
              borderWidth: 1,
            },
          ]}
          placeholderTextColor={colors.textSecondary}
        />
      </View>
    )
  }

  const renderSectionFields = (section) => {
    const sectionColor = section.color
    if (section.groups) {
      return section.groups.map((group, groupIndex) => (
        <View key={groupIndex} style={styles.adminGroup}>
          <ThemedText type='subtitle' style={[styles.groupTitle, { color: sectionColor, borderBottomColor: sectionColor + '20' }]}>
            {group.groupTitle}
          </ThemedText>
          {group.fields.map(field => 
            isEditing ? renderEditField(field, sectionColor) : renderDisplayField(field, sectionColor)
          )}
        </View>
      ))
    } else {
      return section.fields.map(field => 
        isEditing ? renderEditField(field, sectionColor) : renderDisplayField(field, sectionColor)
      )
    }
  }

  const renderSection = (section) => (
    <View key={section.title} style={[styles.sectionContainer, { backgroundColor: colors.cardBackground }]}>
      <View style={styles.sectionHeader}>
        <View style={[styles.sectionTitleRow, { backgroundColor: section.color + '10' }]}>
          {React.cloneElement(section.icon, { color: section.color })}
          <ThemedText type="subtitle" style={[styles.sectionTitle, { color: section.color }]}>
            {section.title}
          </ThemedText>
        </View>
        <View style={[styles.sectionDivider, { backgroundColor: section.color + '30' }]} />
      </View>
      <View style={styles.sectionContent}>
        {renderSectionFields(section)}
      </View>
    </View>
  )

  return (
    <ScrollView
      style={styles.scrollView}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={styles.content}>
        {sections.map(renderSection)}
      </View>
    </ScrollView>
  )
}

export default SchoolInfo