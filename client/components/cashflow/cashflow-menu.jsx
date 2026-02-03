import React, { useEffect, useRef, useState } from 'react'
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Modal,
  Animated,
  Dimensions,
  ScrollView,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { ThemedText } from '@/components/ui/themed-text'
import { Ionicons, MaterialIcons } from '@expo/vector-icons'
import { useTheme } from '@/hooks/useTheme'
import CashflowForm from '@/pages/cashflow/CashflowForm'
import Analytics from '@/pages/cashflow/Analytics'
import Reports from '@/pages/cashflow/Reports'

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window')

export default function CashflowMenu({ visible, onClose }) {
  const { theme, colors } = useTheme()
  const [showIncomeModal, setShowIncomeModal] = useState(false)
  const [showExpenseModal, setShowExpenseModal] = useState(false)
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false)
  const [showReportsModal, setShowReportsModal] = useState(false)
  const translateX = useRef(new Animated.Value(SCREEN_WIDTH)).current
  const backdropOpacity = useRef(new Animated.Value(0)).current
  
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
          tension: 60,
          friction: 12,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start()
    } else {
      Animated.parallel([
        Animated.spring(translateX, {
          toValue: SCREEN_WIDTH,
          useNativeDriver: true,
          tension: 60,
          friction: 12,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start()
    }
  }, [visible])

  const menuItems = [
    { 
      id: 1, 
      title: 'Add Income', 
      icon: 'add-circle', 
      iconType: 'MaterialIcons', 
      gradient: ['#10b981', '#059669'], 
      action: () => setShowIncomeModal(true)
    },
    { 
      id: 2, 
      title: 'Add Expense', 
      icon: 'remove-circle', 
      iconType: 'MaterialIcons', 
      gradient: ['#ef4444', '#dc2626'], 
      action: () => setShowExpenseModal(true)
    },
    { 
      id: 3, 
      title: 'Analytics', 
      icon: 'analytics', 
      iconType: 'MaterialIcons', 
      gradient: ['#8b5cf6', '#7c3aed'], 
      action: () => setShowAnalyticsModal(true)
    },
    { 
      id: 4, 
      title: 'Reports', 
      icon: 'description', 
      iconType: 'MaterialIcons', 
      gradient: ['#f59e0b', '#d97706'], 
      action: () => setShowReportsModal(true)
    },
  ]

  const sections = [
    {
      title: 'Transactions',
      data: menuItems.filter(item => [1,2].includes(item.id)),
    },
    {
      title: 'Insights',
      data: menuItems.filter(item => [3,4].includes(item.id)),
    },
  ]

  const getIcon = (type, name, size, color) => {
    const icons = {
      MaterialIcons: MaterialIcons,
    }
    const Icon = icons[type] || Ionicons
    return <Icon name={name} size={size} color={color} />
  }

  const handleMenuItemPress = (item) => {
    item.action()
  }

  const handleIncomeClose = () => {
    setShowIncomeModal(false)
  }

  const handleExpenseClose = () => {
    setShowExpenseModal(false)
  }

  const handleAnalyticsClose = () => {
    setShowAnalyticsModal(false)
  }

  const handleReportsClose = () => {
    setShowReportsModal(false)
  }

  return (
    <>
      <Modal
        visible={visible}
        transparent
        animationType="none"
        onRequestClose={onClose}
        statusBarTranslucent
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity 
            style={styles.backdropTouchable} 
            activeOpacity={1} 
            onPress={onClose}
          >
            <Animated.View
              style={[
                styles.backdrop,
                {
                  opacity: backdropOpacity,
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                },
              ]}
            />
          </TouchableOpacity>

          <Animated.View
            style={[
              styles.menuContainer,
              {
                backgroundColor: colors.cardBackground,
                transform: [{ translateX: translateX }],
              },
            ]}
          >
            <LinearGradient
              colors={[colors.gradientStart, colors.gradientEnd]}
              style={styles.header}
            >
              <View style={styles.headerRow}>
                <View style={styles.headerLeft}>
                  <Ionicons name="school" size={28} color="#FFFFFF" />
                  <View style={styles.headerText}>
                    <ThemedText type='subtitle' style={styles.schoolName}>
                      Bluri High School
                    </ThemedText>
                    <ThemedText style={styles.menuTitle}>
                      Cashflow Menu
                    </ThemedText>
                  </View>
                </View>
                
                <TouchableOpacity
                  style={styles.closeBtn}
                  onPress={onClose}
                >
                  <Ionicons name="close" size={24} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </LinearGradient>

            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
            >
              {sections.map((section) => (
                <View key={section.title} style={styles.section}>
                  <ThemedText type='subtitle' style={[styles.sectionTitle, { color: colors.text }]}>
                    {section.title}
                  </ThemedText>
                  <View style={styles.items}>
                    {section.data.map((item) => (
                      <TouchableOpacity
                        activeOpacity={.9} 
                        key={item.id}
                        style={[styles.item, { backgroundColor: colors.cardBackground }]}
                        onPress={() => handleMenuItemPress(item)}
                      >
                        <View style={styles.itemContent}>
                          <LinearGradient colors={item.gradient} style={styles.icon}>
                            {getIcon(item.iconType, item.icon, 18, '#FFFFFF')}
                          </LinearGradient>
                          <View style={styles.itemText}>
                            <ThemedText type='subtitle' style={[styles.itemTitle, { color: colors.text }]}>
                              {item.title}
                            </ThemedText>
                            <ThemedText style={[styles.itemValue, { color: colors.textSecondary }]}>
                              View details
                            </ThemedText>
                          </View>
                          <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ))}

              <View style={styles.footer}>
                <ThemedText style={[styles.footerText, { color: colors.textSecondary }]}>
                  Bluri High School App v2.4.1
                </ThemedText>
                <ThemedText style={[styles.footerCopyright, { color: colors.textSecondary }]}>
                  © 2024 All rights reserved
                </ThemedText>
              </View>
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>

      <CashflowForm
        visible={showIncomeModal}
        onClose={handleIncomeClose}
        onSave={(data) => {
          console.log('Income saved:', data)
          handleIncomeClose()
        }}
        type="Income"
        title="Add Income"
        subtitle="Record new income transaction"
      />

      <CashflowForm
        visible={showExpenseModal}
        onClose={handleExpenseClose}
        onSave={(data) => {
          console.log('Expense saved:', data)
          handleExpenseClose()
        }}
        type="Expense"
        title="Add Expense"
        subtitle="Record new expense transaction"
      />

      <Analytics
        visible={showAnalyticsModal}
        onClose={handleAnalyticsClose}
      />

      <Reports
        visible={showReportsModal}
        onClose={handleReportsClose}
      />
    </>
  )
}

const styles = StyleSheet.create({
  modalContainer: { flex: 1 },
  backdropTouchable: StyleSheet.absoluteFillObject,
  backdrop: StyleSheet.absoluteFillObject,
  menuContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: SCREEN_WIDTH * 0.85,
    height: SCREEN_HEIGHT,
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
    overflow: 'hidden',
    ...Platform.select({
      ios: { 
        shadowColor: '#000', 
        shadowOffset: { width: -4, height: 0 }, 
        shadowOpacity: 0.2, 
        shadowRadius: 20 
      },
      android: { elevation: 20 },
    }),
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 70 : 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  headerText: {
    marginLeft: 12,
    flex: 1,
  },
  schoolName: {
    fontSize: 20,
    color: '#FFFFFF',
    marginBottom: 2,
  },
  menuTitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 30 },
  section: { marginTop: 15 },
  sectionTitle: {
    fontSize: 16,
    marginLeft: 20,
    marginBottom: 6,
  },
  items: { paddingHorizontal: 15 },
  item: {
    borderRadius: 12,
    marginBottom: 8,
    ...Platform.select({
      ios: { 
        shadowColor: '#000', 
        shadowOffset: { width: 0, height: 1 }, 
        shadowOpacity: 0.05, 
        shadowRadius: 4 
      },
      android: { elevation: 1 },
    }),
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  icon: {
    width: 42,
    height: 42,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  itemText: {
    flex: 1,
    marginRight: 8,
  },
  itemTitle: {
    fontSize: 14,
    marginBottom: -5,
  },
  itemValue: {
    fontSize: 12,
    opacity: 0.7,
  },
  footer: {
    alignItems: 'center',
    paddingTop: 15,
  },
  footerText: {
    fontSize: 12,
    marginBottom: 4,
  },
  footerCopyright: {
    fontSize: 11,
    opacity: 0.5,
  },
})