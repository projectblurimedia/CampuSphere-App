import React, { useState } from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  StatusBar,
  Modal,
  Dimensions,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { ThemedText } from '@/components/ui/themed-text'
import { ThemedInput } from '@/components/ui/themed-input'
import {
  Ionicons,
  FontAwesome5,
  MaterialCommunityIcons,
  Feather,
  MaterialIcons,
} from '@expo/vector-icons'
import { useTheme } from '@/hooks/useTheme'
const { width: SCREEN_WIDTH } = Dimensions.get('window')

export default function SchoolProfile({ visible, onClose }) {
  const { colors, theme } = useTheme()
  const [isEditing, setIsEditing] = useState(false)
  const [schoolInfo, setSchoolInfo] = useState({
    // Basic Information
    name: 'Bluri High School',
    establishedYear: '1985',
    affiliation: 'CBSE',
    board: 'Central Board of Secondary Education',
   
    // Administration
    principal: 'Dr. Ramesh Kumar',
    principalEmail: 'principal@blurihighschool.edu.in',
    principalPhone: '+91 98765 43211',
    vicePrincipal: 'Ms. Priya Sharma',
    vicePrincipalEmail: 'vp@blurihighschool.edu.in',
    vicePrincipalPhone: '+91 98765 43212',
   
    // Contact Information
    address: 'Kannapuram, Kerala, India - 670301',
    email: 'info@blurihighschool.edu.in',
    phone: '+91 98765 43210',
    website: 'www.blurihighschool.edu.in',
   
    // Statistics
    totalStudents: '1245',
    totalTeachers: '45',
    totalClassrooms: '32',
   
    // Timings
    schoolHours: '8:00 AM - 3:30 PM',
    officeHours: '9:00 AM - 5:00 PM',
    workingDays: 'Monday to Saturday',
    assemblyTime: '7:45 AM',
   
    // Facilities
    facilities: 'Smart Classrooms, Science Labs, Computer Lab, Library, Sports Ground, Auditorium, Cafeteria, Medical Room, Transportation, WiFi Campus',
   
    // Mission & Vision
    mission: 'To provide quality education that empowers students to become responsible citizens and lifelong learners.',
    vision: 'To be a premier educational institution nurturing global citizens with strong values and academic excellence.',
   
    // Additional Info
    motto: 'Learn, Lead, Excel',
    campusArea: '10 Acres',
    libraryBooks: '25,000+',
    computerSystems: '150+',
  })

  const saveSchoolInfo = () => {
    Alert.alert('Success', 'School profile updated successfully!', [
      { text: 'OK', onPress: () => setIsEditing(false) }
    ])
  }

  const handleInputChange = (field, value) => {
    setSchoolInfo(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const statItems = [
    {
      id: 'students',
      title: 'Students',
      value: schoolInfo.totalStudents,
      icon: 'users',
      color: '#3b82f6',
      iconType: 'FontAwesome5'
    },
    {
      id: 'teachers',
      title: 'Teachers',
      value: schoolInfo.totalTeachers,
      icon: 'chalkboard-teacher',
      color: '#10b981',
      iconType: 'FontAwesome5'
    },
    {
      id: 'classrooms',
      title: 'Classrooms',
      value: schoolInfo.totalClassrooms,
      icon: 'door-open',
      color: '#8b5cf6',
      iconType: 'FontAwesome5'
    },
    {
      id: 'established',
      title: 'Established',
      value: schoolInfo.establishedYear,
      icon: 'calendar-alt',
      color: '#f59e0b',
      iconType: 'FontAwesome5'
    },
  ]

  const sections = [
    {
      title: 'Basic Information',
      icon: <MaterialCommunityIcons name="information" size={20} color={colors.tint} />,
      fields: [
        {
          label: 'School Name',
          value: schoolInfo.name,
          key: 'name',
          icon: <FontAwesome5 name="school" size={16} color={colors.tint} />
        },
        {
          label: 'Established',
          value: schoolInfo.establishedYear,
          key: 'establishedYear',
          icon: <FontAwesome5 name="calendar-alt" size={16} color={colors.tint} />
        },
        {
          label: 'Affiliation',
          value: schoolInfo.affiliation,
          key: 'affiliation',
          icon: <MaterialCommunityIcons name="certificate" size={16} color={colors.tint} />
        },
        {
          label: 'Board',
          value: schoolInfo.board,
          key: 'board',
          icon: <Feather name="award" size={16} color={colors.tint} />
        }
      ]
    },
    {
      title: 'Administration',
      icon: <MaterialCommunityIcons name="account-tie" size={20} color={colors.tint} />,
      groups: [
        {
          groupTitle: 'Principal',
          fields: [
            {
              label: 'Name',
              value: schoolInfo.principal,
              key: 'principal',
              icon: <MaterialCommunityIcons name="account-tie" size={16} color={colors.tint} />
            },
            {
              label: 'Email',
              value: schoolInfo.principalEmail,
              key: 'principalEmail',
              icon: <Feather name="mail" size={16} color={colors.tint} />
            },
            {
              label: 'Phone',
              value: schoolInfo.principalPhone,
              key: 'principalPhone',
              icon: <Feather name="phone" size={16} color={colors.tint} />
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
              icon: <MaterialCommunityIcons name="account-tie-hat" size={16} color={colors.tint} />
            },
            {
              label: 'Email',
              value: schoolInfo.vicePrincipalEmail,
              key: 'vicePrincipalEmail',
              icon: <Feather name="mail" size={16} color={colors.tint} />
            },
            {
              label: 'Phone',
              value: schoolInfo.vicePrincipalPhone,
              key: 'vicePrincipalPhone',
              icon: <Feather name="phone" size={16} color={colors.tint} />
            }
          ]
        }
      ]
    },
    {
      title: 'Contact Information',
      icon: <Feather name="phone" size={20} color={colors.tint} />,
      fields: [
        {
          label: 'Address',
          value: schoolInfo.address,
          key: 'address',
          icon: <Feather name="map-pin" size={16} color={colors.tint} />,
          type: 'multiline'
        },
        {
          label: 'Email',
          value: schoolInfo.email,
          key: 'email',
          icon: <Feather name="mail" size={16} color={colors.tint} />
        },
        {
          label: 'Phone',
          value: schoolInfo.phone,
          key: 'phone',
          icon: <Feather name="phone" size={16} color={colors.tint} />
        },
        {
          label: 'Website',
          value: schoolInfo.website,
          key: 'website',
          icon: <Feather name="globe" size={16} color={colors.tint} />
        }
      ]
    },
    {
      title: 'School Timings',
      icon: <Feather name="clock" size={20} color={colors.tint} />,
      fields: [
        {
          label: 'School Hours',
          value: schoolInfo.schoolHours,
          key: 'schoolHours',
          icon: <Feather name="clock" size={16} color={colors.tint} />
        },
        {
          label: 'Office Hours',
          value: schoolInfo.officeHours,
          key: 'officeHours',
          icon: <Feather name="briefcase" size={16} color={colors.tint} />
        },
        {
          label: 'Working Days',
          value: schoolInfo.workingDays,
          key: 'workingDays',
          icon: <Feather name="calendar" size={16} color={colors.tint} />
        },
        {
          label: 'Assembly Time',
          value: schoolInfo.assemblyTime,
          key: 'assemblyTime',
          icon: <Feather name="bell" size={16} color={colors.tint} />
        }
      ]
    },
    {
      title: 'Facilities',
      icon: <MaterialCommunityIcons name="home-group" size={20} color={colors.tint} />,
      fields: [
        {
          label: 'Available Facilities',
          value: schoolInfo.facilities,
          key: 'facilities',
          icon: <MaterialCommunityIcons name="home-group" size={16} color={colors.tint} />,
          type: 'multiline'
        }
      ]
    },
    {
      title: 'Additional Information',
      icon: <Feather name="info" size={20} color={colors.tint} />,
      fields: [
        {
          label: 'Campus Motto',
          value: schoolInfo.motto,
          key: 'motto',
          icon: <FontAwesome5 name="quote-right" size={16} color={colors.tint} />
        },
        {
          label: 'Campus Area',
          value: schoolInfo.campusArea,
          key: 'campusArea',
          icon: <FontAwesome5 name="mountain" size={16} color={colors.tint} />
        },
        {
          label: 'Library Books',
          value: schoolInfo.libraryBooks,
          key: 'libraryBooks',
          icon: <FontAwesome5 name="book" size={16} color={colors.tint} />
        },
        {
          label: 'Computer Systems',
          value: schoolInfo.computerSystems,
          key: 'computerSystems',
          icon: <FontAwesome5 name="desktop" size={16} color={colors.tint} />
        }
      ]
    }
  ]

  const renderStatItem = (item) => {
    const IconComponent = {
      FontAwesome5: FontAwesome5,
      MaterialCommunityIcons: MaterialCommunityIcons,
      MaterialIcons: MaterialIcons,
      Ionicons: Ionicons,
      Feather: Feather,
    }[item.iconType] || FontAwesome5
    return (
      <View key={item.id} style={styles.statItem}>
        <View style={[styles.statIconContainer, { backgroundColor: item.color + '15' }]}>
          <IconComponent name={item.icon} size={16} color={item.color} />
        </View>
        <ThemedText type="subtitle" style={[styles.statValue, { color: colors.text }]}>
          {item.value}
        </ThemedText>
        <ThemedText style={[styles.statLabel, { color: colors.textSecondary }]}>
          {item.title}
        </ThemedText>
      </View>
    )
  }

  const renderField = (fieldConfig) => {
    const { label, value, key, icon, type = 'text' } = fieldConfig
    if (!value && value !== 0) {
      return null
    }
    const fieldLabelRow = label ? (
      <View style={styles.fieldLabelRow}>
        {icon && (
          <View style={[styles.fieldIcon, { backgroundColor: colors.tint + '15' }]}>
            {icon}
          </View>
        )}
        <ThemedText type='subtitle' style={[styles.fieldLabel, { color: colors.textSecondary }]}>
          {label}
        </ThemedText>
      </View>
    ) : null

    if (isEditing) {
      return (
        <View key={key} style={styles.fieldContainer}>
          {fieldLabelRow}
          <ThemedInput
            value={value}
            onChangeText={(text) => handleInputChange(key, text)}
            multiline={type === 'multiline'}
            numberOfLines={type === 'multiline' ? 3 : 1}
            style={[
              styles.fieldInput,
              type === 'multiline' && styles.multilineInput
            ]}
            placeholderTextColor={colors.textSecondary}
          />
        </View>
      )
    } else {
      const displayContainerStyle = [styles.fieldDisplayContainer]
      const textNumberOfLines = type === 'multiline' ? undefined : 2
      if (type === 'multiline') {
        displayContainerStyle.push(styles.multilineDisplayContainer)
      }
      let displayContent = (
        <View style={displayContainerStyle}>
          <ThemedText style={[styles.fieldDisplayText, { color: colors.text }]} numberOfLines={textNumberOfLines}>
            {value || 'Not specified'}
          </ThemedText>
        </View>
      )
      return (
        <View key={key} style={styles.fieldContainer}>
          {fieldLabelRow}
          {displayContent}
        </View>
      )
    }
  }

  const renderSectionFields = (section) => {
    if (section.groups) {
      return section.groups.map((group, groupIndex) => (
        <View key={groupIndex} style={styles.adminGroup}>
          <ThemedText type='subtitle' style={[styles.groupTitle, { color: colors.text }]}>{group.groupTitle}</ThemedText>
          {group.fields.map(renderField)}
        </View>
      ))
    } else {
      return section.fields.map(renderField)
    }
  }

  const renderSection = (section) => (
    <View key={section.title} style={[styles.section, { backgroundColor: colors.cardBackground }]}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleRow}>
          {section.icon}
          <ThemedText type="subtitle" style={[styles.sectionTitle, { color: colors.text }]}>
            {section.title}
          </ThemedText>
        </View>
        <View style={[styles.sectionDivider, { backgroundColor: colors.border }]} />
      </View>
     
      <View style={styles.sectionContent}>
        {renderSectionFields(section)}
      </View>
    </View>
  )

  const handleClose = () => {
    setIsEditing(false)
    onClose()
  }

  const cancelEdit = () => {
    setIsEditing(false)
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
       
        {/* Header with School Name */}
        <LinearGradient
          colors={[colors?.gradientEnd, colors?.gradientStart]}
          style={styles.header}
        >
          <SafeAreaView edges={['top']}>
            <View style={styles.headerContent}>
              <View style={styles.headerTop}>
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={handleClose}
                >
                  <FontAwesome5 
                    name="chevron-left" 
                    size={22} 
                    color="#FFFFFF" 
                    style={{ transform: [{ translateX: -1 }] }}
                  />
                </TouchableOpacity>
               
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => setIsEditing(!isEditing)}
                >
                  <Feather
                    name={isEditing ? "x" : "edit"}
                    size={18}
                    color="#FFFFFF"
                  />
                  <ThemedText style={styles.editButtonText}>
                    {isEditing ? 'Cancel' : 'Edit'}
                  </ThemedText>
                </TouchableOpacity>
              </View>
             
              <View style={styles.schoolInfo}>
                <View style={styles.schoolIconContainer}>
                  <FontAwesome5 name="school" size={28} color="#FFFFFF" />
                </View>
                <View style={styles.schoolText}>
                  <ThemedText type="title" style={styles.schoolName}>
                    {schoolInfo.name}
                  </ThemedText>
                  <ThemedText style={styles.schoolMotto}>
                    "{schoolInfo.motto}"
                  </ThemedText>
                </View>
              </View>
            </View>
          </SafeAreaView>
        </LinearGradient>
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.content}>
            {/* Quick Stats Row - Moved down from header */}
            <View style={[styles.quickStatsContainer, { backgroundColor: colors.cardBackground }]}>
              <ThemedText type='subtitle' style={[styles.quickStatsTitle, { color: colors.text }]}>Quick Stats</ThemedText>
              <View style={styles.quickStats}>
                {statItems.map(renderStatItem)}
              </View>
            </View>

            {/* Render all sections */}
            {sections.map(renderSection)}

            {/* Mission & Vision - Special section */}
            <View style={styles.missionVisionContainer}>
              <View style={[styles.missionCard, { backgroundColor: colors.cardBackground }]}>
                <LinearGradient
                  colors={['rgba(16, 185, 129, 0.1)', 'rgba(16, 185, 129, 0.05)']}
                  style={styles.missionHeader}
                >
                  <MaterialCommunityIcons name="bullseye-arrow" size={20} color="#10b981" />
                  <ThemedText type="subtitle" style={[styles.missionTitle, { color: colors.text }]}>
                    Mission
                  </ThemedText>
                </LinearGradient>
                {renderField({
                  label: '',
                  value: schoolInfo.mission,
                  key: 'mission',
                  type: 'multiline'
                })}
              </View>
              <View style={[styles.visionCard, { backgroundColor: colors.cardBackground }]}>
                <LinearGradient
                  colors={['rgba(59, 130, 246, 0.1)', 'rgba(59, 130, 246, 0.05)']}
                  style={styles.visionHeader}
                >
                  <MaterialCommunityIcons name="eye" size={20} color="#3b82f6" />
                  <ThemedText type="subtitle" style={[styles.visionTitle, { color: colors.text }]}>
                    Vision
                  </ThemedText>
                </LinearGradient>
                {renderField({
                  label: '',
                  value: schoolInfo.vision,
                  key: 'vision',
                  type: 'multiline'
                })}
              </View>
            </View>

            <View style={styles.spacer} />
          </View>
        </ScrollView>
        <View style={[styles.actionButtonsContainer, { backgroundColor: colors.background }]}>
          <View style={styles.actionButtons}>
            {isEditing && (
              <>
                <TouchableOpacity
                  style={[styles.button, styles.discardButton, { borderColor: colors.border, backgroundColor: colors?.danger }]}
                  onPress={cancelEdit}
                >
                  <Ionicons name="trash-outline" size={20} color={'#FFFFFF'} />
                  <ThemedText style={[styles.buttonText, { color: '#FFFFFF' }]}>
                    Discard
                  </ThemedText>
                </TouchableOpacity>
               
                <TouchableOpacity
                  style={[styles.button, styles.saveButton, { backgroundColor: colors.tint }]}
                  onPress={saveSchoolInfo}
                >
                  <Feather name="save" size={20} color="#FFFFFF" />
                  <ThemedText style={[styles.buttonText, { color: '#FFFFFF' }]}>
                    Save Changes
                  </ThemedText>
                </TouchableOpacity>
              </>
            )}
           
            {!isEditing && (
              <TouchableOpacity
                style={[styles.closeButton, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
                onPress={handleClose}
              >
                <ThemedText style={[styles.closeButtonText, { color: colors.text }]}>
                  Close
                </ThemedText>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 70 : 50,
    paddingBottom: 10,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    paddingBottom: 10,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    width: 45,
    height: 45,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  editButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  schoolInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  schoolIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  schoolText: {
    flex: 1,
  },
  schoolName: {
    fontSize: 24,
    color: '#FFFFFF',
  },
  schoolMotto: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontStyle: 'italic',
  },
  quickStatsContainer: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
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
  quickStatsTitle: {
    fontSize: 18,
    marginBottom: 18,
    textAlign: 'center',
  },
  quickStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 0,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  statValue: {
    fontSize: 16,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 200, // Space for fixed buttons
  },
  content: {
    padding: 16,
    paddingTop: 8,
  },
  section: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
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
  },
  sectionTitle: {
    fontSize: 18,
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
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  fieldDisplayContainer: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  multilineDisplayContainer: {
    minHeight: 80,
  },
  fieldDisplayText: {
    fontSize: 15,
    lineHeight: 22,
  },
  missionVisionContainer: {
    gap: 16,
    marginBottom: 16,
  },
  missionCard: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  visionCard: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  missionHeader: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  visionHeader: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  missionTitle: {
    fontSize: 16,
  },
  visionTitle: {
    fontSize: 16,
  },
  spacer: {
    height: 80,
  },
  actionButtonsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  discardButton: {
    borderWidth: 1,
  },
  saveButton: {
    ...Platform.select({
      ios: {
        shadowColor: '#1d9bf0',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  closeButton: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  buttonText: {
    fontSize: 16,
  },
  closeButtonText: {
    fontSize: 16,
  },
})