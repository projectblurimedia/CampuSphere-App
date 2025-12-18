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
  Image,
  TextInput,
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
  const { colors } = useTheme()
  const [isEditing, setIsEditing] = useState(false)
  
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

    // School Images
    images: [
      'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8c2Nob29sJTIwYnVpbGRpbmd8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=500&q=80',
      'https://images.unsplash.com/photo-1562774053-701939374585?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NXx8c2Nob29sJTIwY2FtcHVzfGVufDB8fDB8fHww&auto=format&fit=crop&w=500&q=80',
      'https://images.unsplash.com/photo-1591123120675-6f7f1aae0e5b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTR8fHNjaG9vbCUyMGNsYXNzcm9vbXxlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=500&q=80',
      'https://images.unsplash.com/photo-1523580494863-6f3031224c94?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8c2Nob29sJTIwbGlicmFyeXxlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=500&q=80',
    ],

    // Bus Information
    buses: [
      {
        id: '1',
        busNumber: 'AP07 AB 1234',
        driverName: 'Ramesh Kumar',
        driverPhone: '+91 9876543210',
        route: 'Route 1: Main Town - School',
        capacity: '45 Students',
        morningPickup: '7:30 AM',
        eveningDrop: '4:45 PM'
      },
      {
        id: '2',
        busNumber: 'AP07 CD 5678',
        driverName: 'Suresh Reddy',
        driverPhone: '+91 8765432109',
        route: 'Route 2: Suburbs - School',
        capacity: '40 Students',
        morningPickup: '7:15 AM',
        eveningDrop: '4:30 PM'
      },
      {
        id: '3',
        busNumber: 'AP07 EF 9012',
        driverName: 'Rajesh Naidu',
        driverPhone: '+91 7654321098',
        route: 'Route 3: Villages - School',
        capacity: '35 Students',
        morningPickup: '7:00 AM',
        eveningDrop: '4:15 PM'
      }
    ]
  })

  const [newBus, setNewBus] = useState({
    busNumber: '',
    driverName: '',
    driverPhone: '',
    route: '',
    capacity: '',
    morningPickup: '',
    eveningDrop: ''
  })

  const [showAddBusModal, setShowAddBusModal] = useState(false)

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      paddingTop: Platform.OS === 'ios' ? 70 : 50,
      paddingBottom: 16,
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
      width: 44,
      height: 44,
      borderRadius: 22,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.18)',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.4)',
    },
    titleContainer: {
      flex: 1,
      alignItems: 'center',
    },
    title: {
      fontSize: 20,
      color: '#FFFFFF',
    },
    subtitle: {
      marginTop: 4,
      fontSize: 12,
      color: 'rgba(255,255,255,0.9)',
    },
    editButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.18)',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.4)',
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
      fontWeight: '600',
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
      fontWeight: '500',
    },

    // School Images Section
    imagesContainer: {
      marginTop: 8,
    },
    imagesGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    imageItem: {
      width: '48%',
      height: 120,
      marginBottom: 8,
      borderRadius: 12,
      overflow: 'hidden',
    },
    schoolImage: {
      width: '100%',
      height: '100%',
      resizeMode: 'cover',
    },
    imagePlaceholder: {
      width: '100%',
      height: '100%',
      backgroundColor: colors.inputBackground,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
    },

    // Bus Information Section - Enhanced Design
    busSection: {
      marginTop: 8,
    },
    busList: {
      gap: 12,
    },
    busCard: {
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.inputBackground,
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 4,
        },
        android: {
          elevation: 2,
        },
      }),
    },
    busHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    busNumberBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    busNumberCircle: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    busNumberCircleText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: 'bold',
    },
    busNumber: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    busPlate: {
      backgroundColor: '#fbbf24',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 4,
    },
    busPlateText: {
      color: '#78350f',
      fontSize: 12,
      fontWeight: 'bold',
      letterSpacing: 1,
    },
    busRoute: {
      fontSize: 13,
      color: colors.textSecondary,
      marginBottom: 12,
      fontStyle: 'italic',
    },
    busInfoGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      marginBottom: 12,
    },
    busInfoItem: {
      flex: 1,
      minWidth: '45%',
      backgroundColor: colors.cardBackground,
      padding: 10,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border + '30',
    },
    busInfoLabel: {
      fontSize: 10,
      color: colors.textSecondary,
      marginBottom: 4,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    busInfoValue: {
      fontSize: 13,
      color: colors.text,
      fontWeight: '500',
    },
    busDriverCard: {
      backgroundColor: colors.cardBackground,
      padding: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border + '30',
    },
    busDriverHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
      gap: 8,
    },
    busDriverName: {
      fontSize: 14,
      color: colors.text,
      fontWeight: '600',
    },
    busDriverContact: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    busDriverPhone: {
      fontSize: 12,
      color: colors.text,
    },
    addBusButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 14,
      borderRadius: 14,
      borderWidth: 2,
      borderStyle: 'dashed',
      gap: 10,
      marginTop: 16,
      backgroundColor: colors.primary + '08',
    },
    addBusText: {
      fontSize: 15,
      fontWeight: '600',
    },

    // Bus Modal Styles
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    modalContainer: {
      backgroundColor: colors.background,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingTop: 20,
      paddingBottom: Platform.OS === 'ios' ? 40 : 20,
      maxHeight: SCREEN_WIDTH * 1.2,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      marginBottom: 20,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: '600',
    },
    modalContent: {
      paddingHorizontal: 20,
    },
    modalInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      marginBottom: 12,
      paddingHorizontal: 14,
      height: 50,
      backgroundColor: colors.inputBackground,
    },
    modalInput: {
      flex: 1,
      height: '100%',
      fontSize: 15,
      color: colors.text,
      paddingVertical: 0,
      paddingHorizontal: 0,
      fontFamily: 'Poppins-Medium',
    },
    modalActions: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 24,
      marginBottom: 20,
    },
    modalCancelButton: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 12,
      borderWidth: 1,
      alignItems: 'center',
      borderColor: colors.border,
    },
    modalCancelText: {
      color: colors.text,
      fontSize: 15,
      fontWeight: '500',
    },
    modalAddButton: {
      flex: 2,
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: 'center',
      backgroundColor: colors.primary,
    },
    modalAddText: {
      color: '#FFFFFF',
      fontSize: 15,
      fontWeight: '600',
    },
    requiredStar: {
      color: '#ef4444',
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

  const handleNewBusChange = (field, value) => {
    setNewBus(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const addNewBus = () => {
    if (!newBus.busNumber || !newBus.driverName || !newBus.driverPhone) {
      Alert.alert('Error', 'Please fill all required bus details')
      return
    }

    const newBusWithId = {
      id: Date.now().toString(),
      ...newBus
    }

    setSchoolInfo(prev => ({
      ...prev,
      buses: [...prev.buses, newBusWithId]
    }))

    setNewBus({
      busNumber: '',
      driverName: '',
      driverPhone: '',
      route: '',
      capacity: '',
      morningPickup: '',
      eveningDrop: ''
    })

    setShowAddBusModal(false)
    Alert.alert('Success', 'New bus added successfully!')
  }

  const removeBus = (busId) => {
    Alert.alert(
      'Remove Bus',
      'Are you sure you want to remove this bus?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            setSchoolInfo(prev => ({
              ...prev,
              buses: prev.buses.filter(bus => bus.id !== busId)
            }))
            Alert.alert('Success', 'Bus removed successfully!')
          }
        }
      ]
    )
  }

  const sectionColors = [
    '#3b82f6', // Basic Info - Blue
    '#10b981', // Administration - Green
    '#9115ba', // Contact Info - Purple
    '#e00303', // Timings - Red
    '#8b5cf6', // Facilities - Violet
    '#06b6d4', // Additional Info - Cyan
    '#e38800', // Mission - Orange
    '#f63bd7', // Vision - Pink
    '#22c55e', // School Images - Green
    '#f97316', // Transportation - Orange
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
  ]

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

  const renderSectionContent = (section) => {
    return renderSectionFields(section)
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

  const renderBusCard = (bus, index) => (
    <View key={bus.id} style={styles.busCard}>
      <View style={styles.busHeader}>
        <View style={styles.busNumberBadge}>
          <View style={styles.busNumberCircle}>
            <ThemedText style={styles.busNumberCircleText}>
              {index + 1}
            </ThemedText>
          </View>
          <ThemedText style={styles.busNumber}>
            Bus {index + 1}
          </ThemedText>
        </View>
        <View style={styles.busPlate}>
          <ThemedText style={styles.busPlateText}>
            {bus.busNumber}
          </ThemedText>
        </View>
      </View>
      
      <ThemedText style={styles.busRoute}>
        {bus.route}
      </ThemedText>
      
      <View style={styles.busDriverCard}>
        <View style={styles.busDriverHeader}>
          <FontAwesome5 name="user-tie" size={14} color={colors.primary} />
          <ThemedText style={styles.busDriverName}>
            {bus.driverName}
          </ThemedText>
        </View>
        <View style={styles.busDriverContact}>
          <Feather name="phone" size={12} color={colors.textSecondary} />
          <ThemedText style={styles.busDriverPhone}>
            {bus.driverPhone}
          </ThemedText>
        </View>
      </View>
      
      {isEditing && (
        <TouchableOpacity 
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            backgroundColor: '#ef4444',
            width: 28,
            height: 28,
            borderRadius: 14,
            justifyContent: 'center',
            alignItems: 'center',
          }}
          onPress={() => removeBus(bus.id)}
        >
          <Ionicons name="trash-outline" size={16} color="#FFFFFF" />
        </TouchableOpacity>
      )}
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
    <>
      <Modal
        visible={visible}
        animationType="fade"
        onRequestClose={handleClose}
        statusBarTranslucent
      >
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
       
          {/* Header - Updated like CreateStudent */}
          <LinearGradient
            colors={[colors.gradientStart, colors.gradientEnd]}
            style={styles.header}
          >
            <SafeAreaView edges={['top']}>
              <View style={styles.headerRow}>
                <TouchableOpacity style={styles.backButton} onPress={handleClose}>
                  <FontAwesome5 style={{ marginLeft: -2 }} name="chevron-left" size={20} color="#FFFFFF" />
                </TouchableOpacity>
                <View style={styles.titleContainer}>
                  <ThemedText type='subtitle' style={styles.title}>Campus Profile</ThemedText>
                  <ThemedText style={styles.subtitle}>Manage school information</ThemedText>
                </View>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => setIsEditing(!isEditing)}
                >
                  <Feather
                    name={isEditing ? "x" : "edit-2"}
                    size={20}
                    color="#FFFFFF"
                  />
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
              {/* Render existing sections */}
              {sections.map(renderSection)}
              
              {/* School Images Section */}
              <View style={[styles.sectionContainer, { backgroundColor: colors.cardBackground }]}>
                <View style={styles.sectionHeader}>
                  <View style={[styles.sectionTitleRow, { backgroundColor: sectionColors[8] + '10' }]}>
                    <MaterialCommunityIcons name="image-multiple" size={20} color={sectionColors[8]} />
                    <ThemedText type="subtitle" style={[styles.sectionTitle, { color: sectionColors[8] }]}>
                      School Images
                    </ThemedText>
                  </View>
                  <View style={[styles.sectionDivider, { backgroundColor: sectionColors[8] + '30' }]} />
                </View>
                <View style={styles.imagesContainer}>
                  <View style={styles.imagesGrid}>
                    {schoolInfo.images.map((image, index) => (
                      <View key={index} style={styles.imageItem}>
                        <Image source={{ uri: image }} style={styles.schoolImage} />
                      </View>
                    ))}
                  </View>
                </View>
              </View>
              
              {/* Transportation Section */}
              <View style={[styles.sectionContainer, { backgroundColor: colors.cardBackground }]}>
                <View style={styles.sectionHeader}>
                  <View style={[styles.sectionTitleRow, { backgroundColor: sectionColors[9] + '10' }]}>
                    <FontAwesome5 name="bus-alt" size={20} color={sectionColors[9]} />
                    <ThemedText type="subtitle" style={[styles.sectionTitle, { color: sectionColors[9] }]}>
                      Transportation
                    </ThemedText>
                  </View>
                  <View style={[styles.sectionDivider, { backgroundColor: sectionColors[9] + '30' }]} />
                </View>
                <View style={styles.busSection}>
                  <View style={styles.busList}>
                    {schoolInfo.buses.map((bus, index) => renderBusCard(bus, index))}
                  </View>
                  
                  {isEditing && (
                    <TouchableOpacity
                      style={[
                        styles.addBusButton,
                        { 
                          borderColor: colors.primary,
                          backgroundColor: colors.primary + '08'
                        }
                      ]}
                      onPress={() => setShowAddBusModal(true)}
                    >
                      <Ionicons name="add-circle" size={22} color={colors.primary} />
                      <ThemedText style={[styles.addBusText, { color: colors.primary }]}>
                        Add New Bus
                      </ThemedText>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
              
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
        </View>
      </Modal>

      {/* Add Bus Modal */}
      <Modal
        visible={showAddBusModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAddBusModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowAddBusModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <ThemedText style={[styles.modalTitle, { color: colors.text }]}>
                  Add New Bus
                </ThemedText>
                <TouchableOpacity onPress={() => setShowAddBusModal(false)}>
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ maxHeight: SCREEN_WIDTH * 1 }}>
                <View style={styles.modalContent}>
                  <ThemedText style={[styles.fieldLabel, { marginBottom: 8, color: colors.textSecondary }]}>
                    Bus Number <ThemedText style={styles.requiredStar}>*</ThemedText>
                  </ThemedText>
                  <View style={styles.modalInputContainer}>
                    <FontAwesome5 name="bus-alt" size={16} color={colors.textSecondary} style={{ marginRight: 8 }} />
                    <TextInput
                      style={styles.modalInput}
                      placeholder="e.g., AP07 AB 1234"
                      placeholderTextColor={colors.textSecondary}
                      value={newBus.busNumber}
                      onChangeText={(text) => handleNewBusChange('busNumber', text)}
                    />
                  </View>

                  <ThemedText style={[styles.fieldLabel, { marginBottom: 8, color: colors.textSecondary }]}>
                    Driver Name <ThemedText style={styles.requiredStar}>*</ThemedText>
                  </ThemedText>
                  <View style={styles.modalInputContainer}>
                    <FontAwesome5 name="user-tie" size={16} color={colors.textSecondary} style={{ marginRight: 8 }} />
                    <TextInput
                      style={styles.modalInput}
                      placeholder="Enter driver name"
                      placeholderTextColor={colors.textSecondary}
                      value={newBus.driverName}
                      onChangeText={(text) => handleNewBusChange('driverName', text)}
                    />
                  </View>

                  <ThemedText style={[styles.fieldLabel, { marginBottom: 8, color: colors.textSecondary }]}>
                    Driver Phone <ThemedText style={styles.requiredStar}>*</ThemedText>
                  </ThemedText>
                  <View style={styles.modalInputContainer}>
                    <Feather name="phone" size={16} color={colors.textSecondary} style={{ marginRight: 8 }} />
                    <TextInput
                      style={styles.modalInput}
                      placeholder="Enter driver phone number"
                      placeholderTextColor={colors.textSecondary}
                      value={newBus.driverPhone}
                      onChangeText={(text) => handleNewBusChange('driverPhone', text)}
                      keyboardType="phone-pad"
                    />
                  </View>

                  <ThemedText style={[styles.fieldLabel, { marginBottom: 8, color: colors.textSecondary }]}>
                    Route
                  </ThemedText>
                  <View style={styles.modalInputContainer}>
                    <MaterialIcons name="route" size={16} color={colors.textSecondary} style={{ marginRight: 8 }} />
                    <TextInput
                      style={styles.modalInput}
                      placeholder="e.g., Route 1: Main Town - School"
                      placeholderTextColor={colors.textSecondary}
                      value={newBus.route}
                      onChangeText={(text) => handleNewBusChange('route', text)}
                    />
                  </View>

                  <ThemedText style={[styles.fieldLabel, { marginBottom: 8, color: colors.textSecondary }]}>
                    Capacity
                  </ThemedText>
                  <View style={styles.modalInputContainer}>
                    <Feather name="users" size={16} color={colors.textSecondary} style={{ marginRight: 8 }} />
                    <TextInput
                      style={styles.modalInput}
                      placeholder="e.g., 45 Students"
                      placeholderTextColor={colors.textSecondary}
                      value={newBus.capacity}
                      onChangeText={(text) => handleNewBusChange('capacity', text)}
                    />
                  </View>

                  <ThemedText style={[styles.fieldLabel, { marginBottom: 8, color: colors.textSecondary }]}>
                    Morning Pickup Time
                  </ThemedText>
                  <View style={styles.modalInputContainer}>
                    <Feather name="sunrise" size={16} color={colors.textSecondary} style={{ marginRight: 8 }} />
                    <TextInput
                      style={styles.modalInput}
                      placeholder="e.g., 7:30 AM"
                      placeholderTextColor={colors.textSecondary}
                      value={newBus.morningPickup}
                      onChangeText={(text) => handleNewBusChange('morningPickup', text)}
                    />
                  </View>

                  <ThemedText style={[styles.fieldLabel, { marginBottom: 8, color: colors.textSecondary }]}>
                    Evening Drop Time
                  </ThemedText>
                  <View style={styles.modalInputContainer}>
                    <Feather name="sunset" size={16} color={colors.textSecondary} style={{ marginRight: 8 }} />
                    <TextInput
                      style={styles.modalInput}
                      placeholder="e.g., 4:45 PM"
                      placeholderTextColor={colors.textSecondary}
                      value={newBus.eveningDrop}
                      onChangeText={(text) => handleNewBusChange('eveningDrop', text)}
                    />
                  </View>

                  <View style={styles.modalActions}>
                    <TouchableOpacity
                      style={styles.modalCancelButton}
                      onPress={() => setShowAddBusModal(false)}
                    >
                      <ThemedText style={styles.modalCancelText}>
                        Cancel
                      </ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.modalAddButton}
                      onPress={addNewBus}
                    >
                      <ThemedText style={styles.modalAddText}>
                        Add Bus
                      </ThemedText>
                    </TouchableOpacity>
                  </View>
                </View>
              </ScrollView>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  )
}