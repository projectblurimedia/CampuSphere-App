import React, { useState, useMemo } from 'react'
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
  LayoutAnimation,
  Image,
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
import GalleryModal from './GalleryModal'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

export default function SchoolProfile({ visible, onClose }) {
  const { colors } = useTheme()
  const [isEditing, setIsEditing] = useState(false)
  const [galleryExpanded, setGalleryExpanded] = useState(false)
  const [groupExpanded, setGroupExpanded] = useState({})
  const [galleryModalVisible, setGalleryModalVisible] = useState(false)
  const [currentGroupData, setCurrentGroupData] = useState({
    pics: [],
    title: '',
  })
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [initialViewMode, setInitialViewMode] = useState('grid')
  
  const [schoolInfo, setSchoolInfo] = useState({
    // Basic Information
    name: 'Bluri High School',
    establishedYear: '2002',
    affiliation: 'SSE',
    board: 'Secondary School Examination',
  
    // Administration
    principal: 'Dr. Manikanta Yerraguntla',
    principalEmail: 'principal@blurihighschool.edu.in',
    principalPhone: '+91 7093054784',
    vicePrincipal: 'Ms. Haritha Kotha',
    vicePrincipalEmail: 'vp@blurihighschool.edu.in',
    vicePrincipalPhone: '+91 9391522508',
  
    // Contact Information
    address: 'Kannapuram, Andhra Pradesh, India - 534311',
    email: 'info@blurihighschool.edu.in',
    phone: '+91 9491754784',
    website: 'www.blurihighschool.edu.in',
  
    // Statistics
    totalStudents: '1245',
    totalTeachers: '45',
    totalClassrooms: '32',
  
    // Timings
    schoolHours: '9:00 AM - 4:30 PM',
    officeHours: '8:00 AM - 5:00 PM',
    workingDays: 'Monday to Saturday',
    assemblyTime: '9:00 AM',
  
    // Facilities
    facilities: 'Smart Classrooms, Science Labs, Computer Lab, Library, Sports Ground, Auditorium, Cafeteria, Medical Room, Transportation, WiFi Campus',
  
    // Mission & Vision
    mission: 'To provide quality education that empowers students to become responsible citizens and lifelong learners.',
    vision: 'To be a premier educational institution nurturing global citizens with strong values and academic excellence.',
    motto: 'Learn, Lead, Excel',
    campusArea: '10 Acres',
    libraryBooks: '25,000+',
    computerSystems: '150+',

    // Gallery
    pictures: [
      {
        title: 'Annual Day 2024',
        pics: [
          { uri: 'https://picsum.photos/400/300?random=1', description: 'Students performing on stage' },
          { uri: 'https://picsum.photos/400/300?random=2', description: 'Prize distribution ceremony' },
          { uri: 'https://picsum.photos/400/300?random=3', description: 'Audience cheering' },
          { uri: 'https://picsum.photos/400/300?random=4', description: 'Cultural dance performance' },
          { uri: 'https://picsum.photos/400/300?random=5', description: 'Chief guest address' },
          { uri: 'https://picsum.photos/400/300?random=15', description: 'Group photo' },
        ]
      },
      {
        title: "Children's Day",
        pics: [
          { uri: 'https://picsum.photos/400/300?random=6', description: 'Kids in fancy dress competition' },
          { uri: 'https://picsum.photos/400/300?random=7', description: 'Outdoor games and fun activities' },
          { uri: 'https://picsum.photos/400/300?random=8', description: 'Special assembly program' },
          { uri: 'https://picsum.photos/400/300?random=9', description: 'Cake cutting celebration' },
          { uri: 'https://picsum.photos/400/300?random=10', description: 'Group photo with teachers' },
          { uri: 'https://picsum.photos/400/300?random=11', description: 'Drawing competition winners' },
          { uri: 'https://picsum.photos/400/300?random=12', description: 'Students performing skit' },
          { uri: 'https://picsum.photos/400/300?random=13', description: 'Fun games' },
          { uri: 'https://picsum.photos/400/300?random=14', description: 'Prize distribution' },
        ]
      },
    ],
  })

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      paddingTop: Platform.OS === 'ios' ? 70 : 50,
      paddingBottom: 15,
      paddingHorizontal: 20,
      borderBottomLeftRadius: 24,
      borderBottomRightRadius: 24,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    backButton: {
      width: 45,
      height: 45,
      borderRadius: 22,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    schoolHeaderInfo: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      marginHorizontal: 16,
    },
    schoolName: {
      fontSize: 18,
      color: '#FFFFFF',
    },
    editButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 18,
      gap: 4,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    editButtonText: {
      color: '#FFFFFF',
      fontSize: 12,
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
      marginBottom: 12,
      textAlign: 'center',
    },
    quickStatsTitleDivider: {
      height: 1,
      marginBottom: 16,
    },
    quickStats: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      flexWrap: 'wrap',
    },
    statItem: {
      alignItems: 'center',
      width: SCREEN_WIDTH / 4 - 20,
      marginBottom: 8,
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
      paddingBottom: 120,
    },
    content: {
      padding: 16,
      paddingTop: 8,
    },
    sectionContainer: {
      borderRadius: 16,
      padding: 15,
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
      padding: 12,
      borderRadius: 12,
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
      borderWidth: 1,
    },
    multilineInput: {
      minHeight: 80,
      textAlignVertical: 'top',
      paddingVertical: 12,
    },
    fieldDisplayContainer: {
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 12,
      borderWidth: 1,
    },
    multilineDisplayContainer: {
      minHeight: 80,
    },
    fieldDisplayText: {
      fontSize: 15,
      lineHeight: 22,
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
          elevation: 3,
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
          elevation: 6,
        },
      }),
    },
    buttonText: {
      fontSize: 16,
    },
    // Gallery Styles
    galleryContainer: {
      gap: 12,
    },
    galleryHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      backgroundColor: 'rgba(0,0,0,0.03)',
      borderRadius: 12,
      marginBottom: 8,
    },
    headerTextRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      flex: 1,
    },
    groupsContainer: {
      gap: 12,
    },
    groupContainer: {
      backgroundColor: 'rgba(0,0,0,0.02)',
      borderRadius: 12,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: 'rgba(0,0,0,0.05)',
    },
    groupHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      backgroundColor: 'rgba(0,0,0,0.03)',
    },
    groupPicsContainer: {
      padding: 12,
    },
    picsContainer: {
      flexDirection: 'row',
      gap: 8,
    },
    firstThreePics: {
      flex: 3,
      flexDirection: 'row',
      gap: 8,
    },
    picWrapper: {
      flex: 1,
      aspectRatio: 1,
      borderRadius: 8,
      overflow: 'hidden',
    },
    previewImage: {
      width: '100%',
      height: '100%',
    },
    extraPicWrapper: {
      flex: 1,
      aspectRatio: 1,
    },
    extraPicContainer: {
      width: '100%',
      height: '100%',
      borderRadius: 8,
      overflow: 'hidden',
      position: 'relative',
    },
    extraOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    extraText: {
      color: 'white',
      fontSize: 22,
      fontWeight: 'bold',
    },
    extraImage: {
      width: '100%',
      height: '100%',
    },
    noGallery: {
      padding: 20,
      alignItems: 'center',
    },
    noGalleryText: {
      fontSize: 14,
      textAlign: 'center',
    },
  }), [colors])

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

  const sectionColors = [
    '#3b82f6',
    '#10b981',
    '#9115ba',
    '#e00303',
    '#8b5cf6',
    '#06b6d4',
    '#e38800',
    '#f63bd7',
  ]

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
          label: 'Address',
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
    {
      title: 'Gallery',
      color: sectionColors[0],
      icon: <Ionicons name="images-outline" size={20} color={sectionColors[0]} />,
      isGallery: true
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

  const renderField = (fieldConfig, sectionColor) => {
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
    } else {
      const displayContainerStyle = [styles.fieldDisplayContainer, { backgroundColor: colors?.inputBackground, borderColor: colors?.border }]
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
    const sectionColor = section.color
    if (section.groups) {
      return section.groups.map((group, groupIndex) => (
        <View key={groupIndex} style={styles.adminGroup}>
          <ThemedText type='subtitle' style={[styles.groupTitle, { color: sectionColor }]}>{group.groupTitle}</ThemedText>
          {group.fields.map(field => renderField(field, sectionColor))}
        </View>
      ))
    } else {
      return section.fields.map(field => renderField(field, sectionColor))
    }
  }

  const GalleryPreview = ({ pics, groupIndex, groupTitle }) => {
    const numPics = pics.length
    if (numPics === 0) return null

    const firstThreePics = pics.slice(0, 3)
    const extra = numPics - 3

    const openModal = (mode, index) => {
      setInitialViewMode(mode)
      setCurrentGroupData({
        pics,
        title: groupTitle,
      })
      setSelectedImageIndex(index)
      setGalleryModalVisible(true)
    }

    return (
      <View style={styles.picsContainer}>
        <View style={styles.firstThreePics}>
          {firstThreePics.map((pic, i) => (
            <TouchableOpacity
              key={i}
              style={styles.picWrapper}
              onPress={() => openModal('single', i)}
              activeOpacity={0.7}
            >
              <Image source={{ uri: pic.uri }} style={styles.previewImage} />
            </TouchableOpacity>
          ))}
        </View>
        
        {extra > 0 && (
          <TouchableOpacity
            style={styles.extraPicWrapper}
            onPress={() => openModal('grid', 0)}
            activeOpacity={0.7}
          >
            <View style={styles.extraPicContainer}>
              <Image 
                source={{ uri: pics[3]?.uri || pics[0].uri }} 
                style={styles.extraImage} 
              />
              <View style={styles.extraOverlay}>
                <ThemedText style={styles.extraText}>+{extra}</ThemedText>
              </View>
            </View>
          </TouchableOpacity>
        )}
      </View>
    )
  }

  const renderGallery = () => {
    const pictures = schoolInfo.pictures || []
    
    if (pictures.length === 0) {
      return (
        <View style={styles.noGallery}>
          <ThemedText style={[styles.noGalleryText, { color: colors.textSecondary }]}>
            No gallery events available
          </ThemedText>
        </View>
      )
    }

    return (
      <View style={styles.galleryContainer}>
        <TouchableOpacity
          style={[styles.galleryHeader, { backgroundColor: colors.cardBackground }]}
          onPress={() => {
            LayoutAnimation.easeInEaseOut()
            setGalleryExpanded(!galleryExpanded)
          }}
          activeOpacity={0.7}
        >
          <View style={styles.headerTextRow}>
            <MaterialCommunityIcons name="image-multiple" size={20} color={sectionColors[0]} />
            <ThemedText type="subtitle" style={{ color: colors.text, fontSize: 16 }}>
              Gallery Events ({pictures.length})
            </ThemedText>
          </View>
          <Feather
            name={galleryExpanded ? 'chevron-up' : 'chevron-down'}
            size={24}
            color={colors.textSecondary}
          />
        </TouchableOpacity>
        
        {galleryExpanded && (
          <View style={styles.groupsContainer}>
            {pictures.map((group, gIndex) => (
              <View key={gIndex} style={[styles.groupContainer, { borderColor: colors.border }]}>
                <TouchableOpacity
                  style={[styles.groupHeader, { backgroundColor: colors.cardBackground }]}
                  onPress={() => {
                    LayoutAnimation.easeInEaseOut()
                    const newExpanded = { ...groupExpanded }
                    newExpanded[gIndex] = !newExpanded[gIndex]
                    setGroupExpanded(newExpanded)
                  }}
                  activeOpacity={0.7}
                >
                  <ThemedText type="subtitle" style={{ color: colors.text, fontSize: 16 }}>
                    {group.title} ({group.pics.length})
                  </ThemedText>
                  <Feather
                    name={groupExpanded[gIndex] ? 'chevron-up' : 'chevron-down'}
                    size={24}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
                
                {groupExpanded[gIndex] && (
                  <View style={styles.groupPicsContainer}>
                    <GalleryPreview pics={group.pics} groupIndex={gIndex} groupTitle={group.title} />
                  </View>
                )}
              </View>
            ))}
          </View>
        )}
      </View>
    )
  }

  const renderSectionContent = (section) => {
    if (section.isGallery) {
      return renderGallery()
    } else {
      return renderSectionFields(section)
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
        {renderSectionContent(section)}
      </View>
    </View>
  )

  const handleClose = () => {
    setIsEditing(false)
    setGalleryModalVisible(false)
    setInitialViewMode('grid')
    setSelectedImageIndex(0)
    onClose()
  }

  const cancelEdit = () => {
    setIsEditing(false)
  }

  return (
    <Modal
      visible={visible}
      animationType="fade"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
     
        {/* Header with School Name */}
        <LinearGradient
          colors={[colors?.gradientStart || '#3b82f6', colors?.gradientEnd || '#1d4ed8']}
          style={styles.header}
        >
          <SafeAreaView edges={['top']}>
            <View style={styles.headerRow}>
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
              <View style={styles.schoolHeaderInfo}>
                <FontAwesome5 name="university" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                <ThemedText type="title" style={styles.schoolName}>
                  Campus Profile
                </ThemedText>
              </View>
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
          </SafeAreaView>
        </LinearGradient>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.content}>
            {/* Quick Stats Row */}
            <View style={[styles.quickStatsContainer, { backgroundColor: colors.cardBackground }]}>
              <ThemedText type='subtitle' style={[styles.quickStatsTitle, { color: colors.text }]}>Quick Stats</ThemedText>
              <View style={[styles.quickStatsTitleDivider, { backgroundColor: colors.border }]} />
              <View style={styles.quickStats}>
                {statItems.map(renderStatItem)}
              </View>
            </View>

            {/* Render all sections */}
            {sections.map(renderSection)}
            
            {/* Spacer for fixed buttons */}
            <View style={styles.spacer} />
          </View>
        </ScrollView>

        {/* Fixed Action Buttons */}
        {isEditing && (
          <View style={[styles.actionButtonsContainer, { backgroundColor: colors.background }]}>
            <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[styles.button, styles.discardButton, { borderColor: colors.border, backgroundColor: colors?.danger || '#ef4444' }]}
                  onPress={cancelEdit}
                >
                  <Ionicons name="trash-outline" size={20} color={'#FFFFFF'} />
                  <ThemedText style={[styles.buttonText, { color: '#FFFFFF' }]}>
                    Discard
                  </ThemedText>
                </TouchableOpacity>
             
                <TouchableOpacity
                  style={[styles.button, styles.saveButton, { backgroundColor: colors.tint || '#3b82f6' }]}
                  onPress={saveSchoolInfo}
                >
                  <Feather name="save" size={20} color="#FFFFFF" />
                  <ThemedText style={[styles.buttonText, { color: '#FFFFFF' }]}>
                    Save Changes
                  </ThemedText>
                </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Gallery Modal */}
        <GalleryModal
          visible={galleryModalVisible}
          onClose={() => setGalleryModalVisible(false)}
          currentGroupData={currentGroupData}
          selectedImageIndex={selectedImageIndex}
          onImageIndexChange={setSelectedImageIndex}
          initialViewMode={initialViewMode}
        />
      </View>
    </Modal>
  )
}