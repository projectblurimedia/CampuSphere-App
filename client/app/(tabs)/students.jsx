import { useState, useEffect } from 'react'
import { 
  StyleSheet, 
  View, 
  ScrollView, 
  ActivityIndicator,
} from 'react-native'
import { useTheme } from '@/hooks/useTheme'
import SearchBar from '@/components/students/search-bar'
import ClassGroup from '@/components/students/class-group'
import axiosApi from '@/utils/axiosApi'

export default function Students() {
  const { colors } = useTheme()
  const [classesSummary, setClassesSummary] = useState([])
  const [loading, setLoading] = useState(true)
  const [academicYear, setAcademicYear] = useState('2024-2025')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchClassesSummary()
  }, [academicYear])

  const fetchClassesSummary = async () => {
    setLoading(true)
    try {
      const response = await axiosApi.get(`/students/classes-summary?academicYear=${academicYear}`)
      if (response.data.success) {
        setClassesSummary(response.data.data)
      }
    } catch (error) {
      console.error('Error fetching classes summary:', error.response?.data || error.message)
    } finally {
      setLoading(false)
    }
  }

  const dashboardColors = {
    cardBg: colors.cardBackground,
    border: colors.border,
    success: colors.success,
    warning: colors.warning,
    info: colors.primary,
    danger: colors.danger,
    purple: colors.purple,
  }

  const filteredClasses = searchQuery
    ? classesSummary.filter(cls => 
        cls.class.toString().toLowerCase().includes(searchQuery.toLowerCase()) ||
        cls.totalCount.toString().includes(searchQuery)
      )
    : classesSummary

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.tint} />
      </View>
    )
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SearchBar 
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        dashboardColors={dashboardColors}
      />

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.classGroupsContainer}>
          {filteredClasses.map(classData => (
            <ClassGroup 
              key={classData.class}
              classData={classData}
              academicYear={academicYear}
              dashboardColors={dashboardColors}
              searchQuery={searchQuery}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
    paddingHorizontal: 12,
  },
  classGroupsContainer: {
    marginVertical: 10,
  },
})