import { useState } from 'react'
import { 
  StyleSheet, 
  View, 
  ScrollView, 
  FlatList,
} from 'react-native'
import { ThemedText } from '@/components/ui/themed-text'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTheme } from '@/hooks/useTheme'
import AcademicsHeader from '@/components/academics/academics-header'
import SearchBar from '@/components/academics/search-bar'
import StatsCards from '@/components/academics/stats-cards'
import ClassCard from '@/components/academics/class-card'
import DepartmentFilter from '@/components/academics/department-filter'
import QuickActions from '@/components/academics/quick-actions'

const classesData = [
  {
    id: '1',
    className: 'Class 12 - Science',
    grade: '12',
    section: 'A',
    totalStudents: 42,
    classTeacher: 'Mr. Amit Patel',
    subjects: ['Physics', 'Chemistry', 'Mathematics', 'Biology'],
    room: 'Room 301',
    department: 'Science'
  },
  {
    id: '2',
    className: 'Class 12 - Commerce',
    grade: '12',
    section: 'B',
    totalStudents: 38,
    classTeacher: 'Mrs. Priya Sharma',
    subjects: ['Accountancy', 'Business Studies', 'Economics'],
    room: 'Room 302',
    department: 'Commerce'
  },
  {
    id: '3',
    className: 'Class 11 - Science',
    grade: '11',
    section: 'A',
    totalStudents: 45,
    classTeacher: 'Dr. Rajesh Kumar',
    subjects: ['Physics', 'Chemistry', 'Mathematics'],
    room: 'Room 201',
    department: 'Science'
  },
  {
    id: '4',
    className: 'Class 11 - Arts',
    grade: '11',
    section: 'C',
    totalStudents: 32,
    classTeacher: 'Ms. Sneha Reddy',
    subjects: ['History', 'Political Science', 'Sociology'],
    room: 'Room 203',
    department: 'Arts'
  },
  {
    id: '5',
    className: 'Class 10',
    grade: '10',
    section: 'A',
    totalStudents: 48,
    classTeacher: 'Mr. Rohan Verma',
    subjects: ['Mathematics', 'Science', 'Social Studies'],
    room: 'Room 101',
    department: 'General'
  },
  {
    id: '6',
    className: 'Class 9',
    grade: '9',
    section: 'B',
    totalStudents: 46,
    classTeacher: 'Mrs. Anjali Mehta',
    subjects: ['Mathematics', 'Science', 'English'],
    room: 'Room 102',
    department: 'General'
  },
  {
    id: '7',
    className: 'Class 8',
    grade: '8',
    section: 'A',
    totalStudents: 44,
    classTeacher: 'Mr. Vikram Singh',
    subjects: ['Mathematics', 'Science', 'English'],
    room: 'Room 103',
    department: 'General'
  },
  {
    id: '8',
    className: 'Class 7',
    grade: '7',
    section: 'B',
    totalStudents: 41,
    classTeacher: 'Mrs. Meera Kapoor',
    subjects: ['Mathematics', 'Science', 'English'],
    room: 'Room 104',
    department: 'General'
  },
]

const allDepartments = ['All', ...new Set(classesData.map(cls => cls.department))]

export default function Academics() {
  const { colors, isDark } = useTheme()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDepartment, setSelectedDepartment] = useState('All')

  const dashboardColors = {
    cardBg: isDark ? '#1e293b' : '#ffffff',
    border: isDark ? '#334155' : '#e9ecef',
    success: isDark ? '#34d399' : '#10b981',
    warning: isDark ? '#fbbf24' : '#f59e0b',
    info: isDark ? '#60a5fa' : '#3b82f6',
    danger: isDark ? '#f87171' : '#ef4444',
    purple: isDark ? '#a78bfa' : '#8b5cf6',
  }

  const calculateStats = () => {
    const totalClasses = classesData.length
    const totalStudents = classesData.reduce((sum, cls) => sum + cls.totalStudents, 0)
    const uniqueTeachers = [...new Set(classesData.map(cls => cls.classTeacher))].length
    const avgClassSize = Math.round(totalStudents / totalClasses)
    
    return {
      totalClasses,
      totalStudents,
      totalTeachers: uniqueTeachers,
      avgClassSize
    }
  }

  const statsData = calculateStats()

  const filteredClasses = classesData.filter(cls => {
    const matchesSearch = searchQuery
      ? cls.className.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cls.classTeacher.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cls.room.toLowerCase().includes(searchQuery.toLowerCase())
      : true
    
    const matchesDepartment = selectedDepartment === 'All' || cls.department === selectedDepartment
    
    return matchesSearch && matchesDepartment
  })

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <AcademicsHeader dashboardColors={dashboardColors} />
      
      <SearchBar 
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        dashboardColors={dashboardColors}
      />

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <StatsCards 
          statsData={statsData}
          dashboardColors={dashboardColors}
        />

        <QuickActions 
          dashboardColors={dashboardColors}
        />

        <DepartmentFilter 
          departments={allDepartments.filter(dept => dept !== 'All')}
          selectedDepartment={selectedDepartment}
          setSelectedDepartment={setSelectedDepartment}
          dashboardColors={dashboardColors}
        />

        <View style={styles.resultsHeader}>
          <ThemedText type='subtitle' style={[styles.resultsTitle, { color: colors.text }]}>
            Classes ({filteredClasses.length})
          </ThemedText>
          <ThemedText style={[styles.resultsSubtitle, { color: colors.textSecondary }]}>
            Sorted by: Grade
          </ThemedText>
        </View>

        <FlatList
          data={filteredClasses}
          renderItem={({ item }) => (
            <ClassCard 
              classData={item} 
              dashboardColors={dashboardColors} 
            />
          )}
          keyExtractor={item => item.id}
          scrollEnabled={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <ThemedText style={[styles.emptyText, { color: colors.textSecondary }]}>
                No classes found
              </ThemedText>
              <ThemedText style={[styles.emptySubtext, { color: colors.textSecondary }]}>
                Try changing your search or filter criteria
              </ThemedText>
            </View>
          }
        />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
    paddingHorizontal: 20,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 16,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  resultsSubtitle: {
    fontSize: 13,
    opacity: 0.8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    opacity: 0.7,
    textAlign: 'center',
  },
})