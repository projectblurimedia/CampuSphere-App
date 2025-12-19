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
  FlatList,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import * as ImagePicker from 'expo-image-picker'
import { ThemedText } from '@/components/ui/themed-text'
import { ThemedInput } from '@/components/ui/themed-input'
import {
  Ionicons,
  FontAwesome5,
  MaterialCommunityIcons,
  Feather,
  MaterialIcons,
  AntDesign,
} from '@expo/vector-icons'
import { useTheme } from '@/hooks/useTheme'

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window')

export default function SchoolProfile({ visible, onClose }) {
  const { colors } = useTheme()
  const [isEditing, setIsEditing] = useState(false)
  const [selectedImageIndex, setSelectedImageIndex] = useState(null)
  const [showImageModal, setShowImageModal] = useState(false)
  
  const [schoolInfo, setSchoolInfo] = useState({
    name: 'Bluri High School',
    establishedYear: '2002',
    affiliation: 'SSE',
    board: 'Secondary School Examination',

    principal: 'Dr. Manikanta Yerraguntla',
    principalEmail: 'principal@blurihighschool.edu.in',
    principalPhone: '+91 7093054784',
    vicePrincipal: 'Ms. Haritha Kotha',
    vicePrincipalEmail: 'vp@blurihighschool.edu.in',
    vicePrincipalPhone: '+91 9391522508',

    address: 'Kannapuram, Andhra Pradesh, India - 534311',
    email: 'info@blurihighschool.edu.in',
    phone: '+91 9491754784',
    website: 'www.blurihighschool.edu.in',

    schoolHours: '9:00 AM - 4:30 PM',
    officeHours: '8:00 AM - 5:00 PM',
    workingDays: 'Monday to Saturday',
    assemblyTime: '9:00 AM',

    facilities: 'Smart Classrooms, Science Labs, Computer Lab, Library, Sports Ground, Auditorium, Cafeteria, Medical Room, Transportation, WiFi Campus',

    mission: 'To provide quality education that empowers students to become responsible citizens and lifelong learners.',
    vision: 'To be a premier educational institution nurturing global citizens with strong values and academic excellence.',
    motto: 'Learn, Lead, Excel',
    campusArea: '10 Acres',
    libraryBooks: '25,000+',
    computerSystems: '150+',

    images: [
      'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8c2Nob29sJTIwYnVpbGRpbmd8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=500&q=80',
      'https://images.unsplash.com/photo-1562774053-701939374585?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NXx8c2Nob29sJTIwY2FtcHVzfGVufDB8fDB8fHww&auto=format&fit=crop&w=500&q=80',
      'https://images.unsplash.com/photo-1591123120675-6f7f1aae0e5b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTR8fHNjaG9vbCUyMGNsYXNzcm9vbXxlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=500&q=80',
      'https://images.unsplash.com/photo-1523580494863-6f3031224c94?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8c2Nob29sJTIwbGlicmFyeXxlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=500&q=80',
    ],

    buses: [
      {
        _id: '1',
        name: 'Main Town Bus',
        busNumber: 'AP07 AB 1234',
        driverName: 'Ramesh Kumar',
        driverPhone: '+91 9876543210',
        routes: ['Main Town', 'Market Area', 'School'],
        createdAt: '2023-01-15T08:30:00.000Z'
      },
      {
        _id: '2',
        name: 'Suburbs Bus',
        busNumber: 'AP07 CD 5678',
        driverName: 'Suresh Reddy',
        driverPhone: '+91 8765432109',
        routes: ['Suburbs', 'Residential Area', 'School'],
        createdAt: '2023-02-20T09:15:00.000Z'
      },
      {
        _id: '3',
        name: 'Village Bus',
        busNumber: 'AP07 EF 9012',
        driverName: 'Rajesh Naidu',
        driverPhone: '+91 7654321098',
        routes: ['Villages', 'Rural Area', 'School'],
        createdAt: '2023-03-10T07:45:00.000Z'
      }
    ]
  })

  const [editingBus, setEditingBus] = useState(null)
  const [showBusModal, setShowBusModal] = useState(false)
  const [newRouteInput, setNewRouteInput] = useState('')
  const [busFormData, setBusFormData] = useState({
    name: '',
    busNumber: '',
    driverName: '',
    driverPhone: '',
    routes: ['']
  })

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
    // Enhanced Display Mode Styles - Row Layout, Attractive
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
    displayGroupHeader: {
      fontSize: 18,
      fontWeight: '700',
      marginBottom: 12,
      paddingBottom: 8,
      borderBottomWidth: 2,
      borderBottomColor: 'transparent',
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
      // marginTop: 8,
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
    addImageButton: {
      width: '48%',
      height: 120,
      marginBottom: 8,
      borderRadius: 12,
      borderWidth: 2,
      borderStyle: 'dashed',
      borderColor: colors.primary,
      backgroundColor: colors.primary + '08',
      justifyContent: 'center',
      alignItems: 'center',
    },
    addImageText: {
      fontSize: 14,
      color: colors.primary,
      fontWeight: '600',
      marginTop: 4,
    },
    imageOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.4)',
      justifyContent: 'center',
      alignItems: 'center',
      opacity: 0,
    },
    imageOverlayVisible: {
      opacity: 1,
    },
    imageActions: {
      flexDirection: 'row',
      gap: 10,
    },
    imageActionButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: 'rgba(255,255,255,0.9)',
      justifyContent: 'center',
      alignItems: 'center',
    },

    // Bus Information Section - Compact Row Info Items
    busSection: {
      // marginTop: 8,
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
          elevation: .5,
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
    busName: {
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
    busRoutesContainer: {
      marginBottom: 12,
    },
    busRoutesLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      marginBottom: 4,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    busRoutesList: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      marginTop: 4,
    },
    routeTag: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.primary + '15',
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.primary + '30',
    },
    routeTagText: {
      fontSize: 11,
      color: colors.primary,
      marginRight: 4,
    },
    busInfoItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: colors.cardBackground,
      padding: 10,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border + '30',
      marginBottom: 8,
    },
    busInfoLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      fontWeight: '500',
    },
    busInfoValue: {
      fontSize: 14,
      color: colors.text,
      fontWeight: '600',
      textAlign: 'right',
    },
    busActions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: 10,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: colors.border + '30',
    },
    busActionButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
      gap: 6,
    },
    busEditButton: {
      backgroundColor: colors.primary + '15',
      borderWidth: 1,
      borderColor: colors.primary,
    },
    busDeleteButton: {
      backgroundColor: '#ef4444' + '15',
      borderWidth: 1,
      borderColor: '#ef4444',
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

    // Bus Modal Styles - Improved Scrolling and Size
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    modalContainer: {
      backgroundColor: colors.background,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      maxHeight: SCREEN_HEIGHT * 0.9,
      minHeight: SCREEN_HEIGHT * 0.6,
      flex: 1,
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      gap: 12,
    },
    modalTitleContainer: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    modalTitleIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.primary + '15',
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: '600',
    },
    modalScrollContent: {
      flexGrow: 1,
      paddingHorizontal: 20,
      paddingBottom: 20,
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
    routesContainer: {
      marginBottom: 16,
    },
    routesHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    routeInputContainer: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 8,
    },
    routeInput: {
      flex: 1,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      backgroundColor: colors.inputBackground,
      fontFamily: 'Poppins-Medium',
    },
    addRouteButton: {
      backgroundColor: colors.primary,
      borderRadius: 8,
      paddingHorizontal: 16,
      justifyContent: 'center',
      alignItems: 'center',
    },
    routesList: {
      gap: 6,
    },
    routeItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.inputBackground,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    routeText: {
      flex: 1,
      fontSize: 14,
      color: colors.text,
    },
    deleteRouteButton: {
      padding: 4,
    },
    modalActions: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 24,
      paddingHorizontal: 20,
      paddingBottom: 20,
    },
    modalCancelButton: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 12,
      borderWidth: 1,
      alignItems: 'center',
      borderColor: colors.border,
      backgroundColor: colors.danger,
    },
    modalCancelText: {
      color: 'aliceblue',
      fontSize: 15,
    },
    modalSaveButton: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: 'center',
      backgroundColor: colors.primary,
    },
    modalSaveText: {
      color: '#FFFFFF',
      fontSize: 15,
    },
    requiredStar: {
      color: '#ef4444',
    },

    // Image Modal Styles
    imageModalContainer: {
      flex: 1,
      backgroundColor: '#000',
    },
    imageModalHeader: {
      position: 'absolute',
      top: Platform.OS === 'ios' ? 70 : 50,
      left: 20,
      right: 20,
      zIndex: 100,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    imageModalImage: {
      width: SCREEN_WIDTH,
      height: SCREEN_HEIGHT,
      resizeMode: 'contain',
    },
    imagePagination: {
      position: 'absolute',
      bottom: 50,
      left: 0,
      right: 0,
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 8,
    },
    paginationDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: 'rgba(255,255,255,0.5)',
    },
    paginationDotActive: {
      backgroundColor: '#FFFFFF',
      width: 20,
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

  const handleBusInputChange = (field, value) => {
    setBusFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant permission to access your photo library.')
      return
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    })

    if (!result.canceled) {
      setSchoolInfo(prev => ({
        ...prev,
        images: [...prev.images, result.assets[0].uri]
      }))
    }
  }

  const openAddBusModal = () => {
    setEditingBus(null)
    setBusFormData({
      name: '',
      busNumber: '',
      driverName: '',
      driverPhone: '',
      routes: ['']
    })
    setNewRouteInput('')
    setShowBusModal(true)
  }

  const openEditBusModal = (bus) => {
    setEditingBus(bus)
    setBusFormData({
      name: bus.name,
      busNumber: bus.busNumber,
      driverName: bus.driverName,
      driverPhone: bus.driverPhone,
      routes: [...bus.routes]
    })
    setNewRouteInput('')
    setShowBusModal(true)
  }

  const addRoute = () => {
    if (newRouteInput.trim()) {
      setBusFormData(prev => ({
        ...prev,
        routes: [...prev.routes, newRouteInput.trim()]
      }))
      setNewRouteInput('')
    }
  }

  const deleteRoute = (index) => {
    setBusFormData(prev => ({
      ...prev,
      routes: prev.routes.filter((_, i) => i !== index)
    }))
  }

  const saveBus = () => {
    if (!busFormData.name || !busFormData.busNumber || !busFormData.driverName || !busFormData.driverPhone) {
      Alert.alert('Error', 'Please fill all required fields')
      return
    }

    const filteredRoutes = busFormData.routes.filter(route => route.trim() !== '')
    
    if (editingBus) {
      // Update existing bus
      setSchoolInfo(prev => ({
        ...prev,
        buses: prev.buses.map(bus => 
          bus._id === editingBus._id 
            ? { 
                ...bus, 
                name: busFormData.name,
                busNumber: busFormData.busNumber,
                driverName: busFormData.driverName,
                driverPhone: busFormData.driverPhone,
                routes: filteredRoutes.length > 0 ? filteredRoutes : ['Not specified']
              }
            : bus
        )
      }))
      Alert.alert('Success', 'Bus updated successfully!')
    } else {
      // Add new bus
      const newBus = {
        _id: Date.now().toString(),
        name: busFormData.name,
        busNumber: busFormData.busNumber,
        driverName: busFormData.driverName,
        driverPhone: busFormData.driverPhone,
        routes: filteredRoutes.length > 0 ? filteredRoutes : ['Not specified'],
        createdAt: new Date().toISOString()
      }
      
      setSchoolInfo(prev => ({
        ...prev,
        buses: [...prev.buses, newBus]
      }))
      Alert.alert('Success', 'Bus added successfully!')
    }
    
    setShowBusModal(false)
  }

  const deleteBus = (busId) => {
    Alert.alert(
      'Delete Bus',
      'Are you sure you want to delete this bus?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setSchoolInfo(prev => ({
              ...prev,
              buses: prev.buses.filter(bus => bus._id !== busId)
            }))
            Alert.alert('Success', 'Bus deleted successfully!')
          }
        }
      ]
    )
  }

  const deleteImage = (index) => {
    Alert.alert(
      'Delete Image',
      'Are you sure you want to delete this image?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setSchoolInfo(prev => ({
              ...prev,
              images: prev.images.filter((_, i) => i !== index)
            }))
          }
        }
      ]
    )
  }

  const openImageModal = (index) => {
    setSelectedImageIndex(index)
    setShowImageModal(true)
  }

  const goToNextImage = () => {
    if (selectedImageIndex < schoolInfo.images.length - 1) {
      setSelectedImageIndex(prev => prev + 1)
    }
  }

  const goToPrevImage = () => {
    if (selectedImageIndex > 0) {
      setSelectedImageIndex(prev => prev - 1)
    }
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
    <View key={bus._id} style={styles.busCard}>
      <View style={styles.busHeader}>
        <View style={styles.busNumberBadge}>
          <View style={styles.busNumberCircle}>
            <ThemedText style={styles.busNumberCircleText}>
              {index + 1}
            </ThemedText>
          </View>
          <ThemedText style={styles.busName}>
            {bus.name}
          </ThemedText>
        </View>
        <View style={styles.busPlate}>
          <ThemedText style={styles.busPlateText}>
            {bus.busNumber}
          </ThemedText>
        </View>
      </View>
      
      <View style={styles.busRoutesContainer}>
        <ThemedText style={styles.busRoutesLabel}>Routes</ThemedText>
        <View style={styles.busRoutesList}>
          {bus.routes.map((route, routeIndex) => (
            <View key={routeIndex} style={styles.routeTag}>
              <ThemedText style={styles.routeTagText}>{route}</ThemedText>
            </View>
          ))}
        </View>
      </View>
      
      <View style={styles.busInfoItem}>
        <ThemedText style={styles.busInfoLabel}>Driver</ThemedText>
        <ThemedText style={styles.busInfoValue}>{bus.driverName}</ThemedText>
      </View>
      
      <View style={styles.busInfoItem}>
        <ThemedText style={styles.busInfoLabel}>Contact</ThemedText>
        <ThemedText style={styles.busInfoValue}>{bus.driverPhone}</ThemedText>
      </View>
      
      {isEditing && (
        <View style={styles.busActions}>
          <TouchableOpacity 
            style={[styles.busActionButton, styles.busEditButton]}
            onPress={() => openEditBusModal(bus)}
          >
            <Feather name="edit" size={14} color={colors.primary} />
            <ThemedText style={{ color: colors.primary, fontSize: 13 }}>
              Edit
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.busActionButton, styles.busDeleteButton]}
            onPress={() => deleteBus(bus._id)}
          >
            <Ionicons name="trash-outline" size={14} color="#ef4444" />
            <ThemedText style={{ color: '#ef4444', fontSize: 13 }}>
              Delete
            </ThemedText>
          </TouchableOpacity>
        </View>
      )}
    </View>
  )

  const renderImageItem = (image, index) => (
    <TouchableOpacity 
      key={index} 
      style={styles.imageItem}
      onPress={() => openImageModal(index)}
      activeOpacity={0.8}
    >
      <Image source={{ uri: image }} style={styles.schoolImage} />
      {isEditing && (
        <View style={[styles.imageOverlay, styles.imageOverlayVisible]}>
          <View style={styles.imageActions}>
            <TouchableOpacity 
              style={styles.imageActionButton}
              onPress={(e) => {
                e.stopPropagation()
                deleteImage(index)
              }}
            >
              <Ionicons name="trash-outline" size={18} color="#ef4444" />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </TouchableOpacity>
  )

  const renderImagesGrid = () => {
    const imageSlots = 4
    const currentImages = schoolInfo.images.length
    const placeholders = []

    for (let i = 0; i < imageSlots; i++) {
      if (i < currentImages) {
        placeholders.push(renderImageItem(schoolInfo.images[i], i))
      } else if (isEditing) {
        placeholders.push(
          <TouchableOpacity
            key={`add-${i}`}
            style={styles.addImageButton}
            onPress={pickImage}
          >
            <Ionicons name="add-circle" size={32} color={colors.primary} />
            <ThemedText style={styles.addImageText}>Add Image</ThemedText>
          </TouchableOpacity>
        )
      }
    }

    return (
      <View style={styles.imagesGrid}>
        {placeholders}
      </View>
    )
  }

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
                  {renderImagesGrid()}
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
                      onPress={openAddBusModal}
                    >
                      <Ionicons name="add-circle" size={22} color={colors.primary} />
                      <ThemedText style={[styles.addBusText, { color: colors.primary }]}>
                        Add New Bus
                      </ThemedText>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
              
              <View style={styles.spacer} />
            </View>
          </ScrollView>

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

      {/* Bus Modal */}
      <Modal
        visible={showBusModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowBusModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowBusModal(false)}
        >
          <TouchableOpacity 
            activeOpacity={1}
            onPress={() => {}}
            style={styles.modalContainer}
          >
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleContainer}>
                <View style={styles.modalTitleIcon}>
                  <FontAwesome5 name="bus-alt" size={20} color={colors.primary} />
                </View>
                <ThemedText style={[styles.modalTitle, { color: colors.text }]}>
                  {editingBus ? 'Edit Bus' : 'Add New Bus'}
                </ThemedText>
              </View>
              <TouchableOpacity onPress={() => setShowBusModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView 
              style={{ flex: 1 }} 
              contentContainerStyle={styles.modalScrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <ThemedText style={[styles.fieldLabel, { marginBottom: 8, color: colors.textSecondary }]}>
                Bus Name <ThemedText style={styles.requiredStar}>*</ThemedText>
              </ThemedText>
              <View style={styles.modalInputContainer}>
                <FontAwesome5 name="bus" size={16} color={colors.textSecondary} style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.modalInput}
                  placeholder="e.g., Main Town Bus"
                  placeholderTextColor={colors.textSecondary}
                  value={busFormData.name}
                  onChangeText={(text) => handleBusInputChange('name', text)}
                />
              </View>

              <ThemedText style={[styles.fieldLabel, { marginBottom: 8, color: colors.textSecondary }]}>
                Bus Number <ThemedText style={styles.requiredStar}>*</ThemedText>
              </ThemedText>
              <View style={styles.modalInputContainer}>
                <FontAwesome5 name="hashtag" size={16} color={colors.textSecondary} style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.modalInput}
                  placeholder="e.g., AP07 AB 1234"
                  placeholderTextColor={colors.textSecondary}
                  value={busFormData.busNumber}
                  onChangeText={(text) => handleBusInputChange('busNumber', text)}
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
                  value={busFormData.driverName}
                  onChangeText={(text) => handleBusInputChange('driverName', text)}
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
                  value={busFormData.driverPhone}
                  onChangeText={(text) => handleBusInputChange('driverPhone', text)}
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.routesContainer}>
                <View style={styles.routesHeader}>
                  <ThemedText style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                    Routes
                  </ThemedText>
                </View>
                <View style={styles.routeInputContainer}>
                  <TextInput
                    style={[styles.routeInput, { color: colors.text }]}
                    placeholder="Add a route (e.g., Main Town)"
                    placeholderTextColor={colors.textSecondary}
                    value={newRouteInput}
                    onChangeText={setNewRouteInput}
                  />
                  <TouchableOpacity
                    style={styles.addRouteButton}
                    onPress={addRoute}
                  >
                    <Ionicons name="add" size={20} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
                <View style={styles.routesList}>
                  {busFormData.routes.map((route, index) => (
                    <View key={index} style={styles.routeItem}>
                      <ThemedText style={styles.routeText}>{route}</ThemedText>
                      <TouchableOpacity
                        style={styles.deleteRouteButton}
                        onPress={() => deleteRoute(index)}
                      >
                        <Ionicons name="close-circle" size={20} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowBusModal(false)}
              >
                <ThemedText style={styles.modalCancelText}>
                  Cancel
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSaveButton}
                onPress={saveBus}
              >
                <ThemedText style={styles.modalSaveText}>
                  {editingBus ? 'Update Bus' : 'Add Bus'}
                </ThemedText>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Image Modal */}
      <Modal
        visible={showImageModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowImageModal(false)}
      >
        <View style={styles.imageModalContainer}>
          <StatusBar barStyle="light-content" />
          
          <View style={styles.imageModalHeader}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => setShowImageModal(false)}
            >
              <FontAwesome5 style={{ marginLeft: -2 }} name="chevron-left" size={20} color="#FFFFFF" />
            </TouchableOpacity>
            <View style={styles.titleContainer}>
              <ThemedText style={[styles.title, { color: '#FFFFFF' }]}>
                School Images
              </ThemedText>
              <ThemedText style={[styles.subtitle, { color: 'rgba(255,255,255,0.8)' }]}>
                {selectedImageIndex !== null ? `${selectedImageIndex + 1} of ${schoolInfo.images.length}` : ''}
              </ThemedText>
            </View>
            <View style={{ width: 44 }} />
          </View>

          {selectedImageIndex !== null && (
            <Image
              source={{ uri: schoolInfo.images[selectedImageIndex] }}
              style={styles.imageModalImage}
            />
          )}

          <View style={styles.imagePagination}>
            {schoolInfo.images.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.paginationDot,
                  index === selectedImageIndex && styles.paginationDotActive
                ]}
              />
            ))}
          </View>

          {selectedImageIndex !== null && (
            <>
              {selectedImageIndex > 0 && (
                <TouchableOpacity
                  style={{
                    position: 'absolute',
                    left: 20,
                    top: SCREEN_HEIGHT / 2 - 30,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    width: 60,
                    height: 60,
                    borderRadius: 30,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                  onPress={goToPrevImage}
                >
                  <Ionicons name="chevron-back" size={30} color="#FFFFFF" />
                </TouchableOpacity>
              )}
              {selectedImageIndex < schoolInfo.images.length - 1 && (
                <TouchableOpacity
                  style={{
                    position: 'absolute',
                    right: 20,
                    top: SCREEN_HEIGHT / 2 - 30,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    width: 60,
                    height: 60,
                    borderRadius: 30,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                  onPress={goToNextImage}
                >
                  <Ionicons name="chevron-forward" size={30} color="#FFFFFF" />
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      </Modal>
    </>
  )
}