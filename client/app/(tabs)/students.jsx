import { useState } from 'react'
import { 
  StyleSheet, 
  View, 
  ScrollView, 
  FlatList,
  useColorScheme
} from 'react-native'
import { ThemedText } from '@/components/ui/themed-text'
import { Colors } from '@/constants/theme'
import { SafeAreaView } from 'react-native-safe-area-context'
import StudentsHeader from '@/components/students/students-header'
import SearchBar from '@/components/students/search-bar'
import StatsCards from '@/components/students/stats-cards'
import ClassGroup from '@/components/students/class-group'
import StudentCard from '@/components/students/student-card'
import QuickActions from '@/components/students/quick-actions'

// Mock student data
const studentsData = [
  {
    id: '1',
    name: 'Aarav Sharma',
    class: 'Class 12 - Science',
    rollNo: '12A001',
    attendance: '95%',
    fees: 'Paid',
    parent: 'Mr. Ramesh Sharma',
    contact: '+91 9876543210'
  },
  {
    id: '2',
    name: 'Priya Patel',
    class: 'Class 12 - Science',
    rollNo: '12A002',
    attendance: '92%',
    fees: 'Pending',
    parent: 'Mrs. Sunita Patel',
    contact: '+91 9876543211'
  },
  {
    id: '3',
    name: 'Rohan Verma',
    class: 'Class 12 - Science',
    rollNo: '12A003',
    attendance: '98%',
    fees: 'Paid',
    parent: 'Mr. Amit Verma',
    contact: '+91 9876543212'
  },
  {
    id: '4',
    name: 'Sneha Reddy',
    class: 'Class 11 - Commerce',
    rollNo: '11C001',
    attendance: '90%',
    fees: 'Paid',
    parent: 'Mr. Rajesh Reddy',
    contact: '+91 9876543213'
  },
  {
    id: '5',
    name: 'Kunal Mehta',
    class: 'Class 11 - Commerce',
    rollNo: '11C002',
    attendance: '88%',
    fees: 'Pending',
    parent: 'Mrs. Anita Mehta',
    contact: '+91 9876543214'
  },
  {
    id: '6',
    name: 'Anjali Gupta',
    class: 'Class 10',
    rollNo: '10A001',
    attendance: '96%',
    fees: 'Paid',
    parent: 'Mr. Sanjay Gupta',
    contact: '+91 9876543215'
  },
  {
    id: '7',
    name: 'Vikram Singh',
    class: 'Class 10',
    rollNo: '10A002',
    attendance: '94%',
    fees: 'Paid',
    parent: 'Mr. Raj Singh',
    contact: '+91 9876543216'
  },
  {
    id: '8',
    name: 'Neha Kapoor',
    class: 'Class 9',
    rollNo: '9A001',
    attendance: '91%',
    fees: 'Pending',
    parent: 'Mrs. Meera Kapoor',
    contact: '+91 9876543217'
  },
]

// Group students by class
const groupedStudents = studentsData.reduce((acc, student) => {
  if (!acc[student.class]) {
    acc[student.class] = []
  }
  acc[student.class].push(student)
  return acc
}, {})

export default function Students() {
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme ?? 'light']
  const isDark = colorScheme === 'dark'
  
  const [expandedClasses, setExpandedClasses] = useState(['Class 12 - Science'])
  const [searchQuery, setSearchQuery] = useState('')

  const dashboardColors = {
    cardBg: isDark ? '#1e293b' : '#ffffff',
    border: isDark ? '#334155' : '#e9ecef',
    success: isDark ? '#34d399' : '#10b981',
    warning: isDark ? '#fbbf24' : '#f59e0b',
    info: isDark ? '#60a5fa' : '#3b82f6',
    danger: isDark ? '#f87171' : '#ef4444',
    purple: isDark ? '#a78bfa' : '#8b5cf6',
  }

  const toggleClassExpansion = (className) => {
    if (expandedClasses.includes(className)) {
      setExpandedClasses(expandedClasses.filter(c => c !== className))
    } else {
      setExpandedClasses([...expandedClasses, className])
    }
  }

  const filteredStudents = searchQuery
    ? studentsData.filter(student => 
        student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.rollNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.class.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : studentsData

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StudentsHeader colors={colors} dashboardColors={dashboardColors} />
      
      <SearchBar 
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        colors={colors}
        dashboardColors={dashboardColors}
      />

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <StatsCards 
          studentsData={studentsData}
          colors={colors}
          dashboardColors={dashboardColors}
        />

        <QuickActions 
          colors={colors}
          dashboardColors={dashboardColors}
        />

        {searchQuery ? (
          <View style={styles.searchResults}>
            <ThemedText type='subtitle' style={[styles.resultsTitle, { color: colors.text }]}>
              Search Results ({filteredStudents.length})
            </ThemedText>
            <FlatList
              data={filteredStudents}
              renderItem={({ item }) => (
                <StudentCard 
                  student={item} 
                  colors={colors} 
                  dashboardColors={dashboardColors} 
                />
              )}
              keyExtractor={item => item.id}
              scrollEnabled={false}
            />
          </View>
        ) : (
          <View style={styles.classGroupsContainer}>
            <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
              Students by Class
            </ThemedText>
            {Object.keys(groupedStudents).map(className => (
              <ClassGroup 
                key={className}
                className={className}
                students={groupedStudents[className]}
                isExpanded={expandedClasses.includes(className)}
                onToggle={toggleClassExpansion}
                colors={colors}
                dashboardColors={dashboardColors}
                searchQuery={searchQuery}
              />
            ))}
          </View>
        )}
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
  searchResults: {
    marginBottom: 20,
  },
  resultsTitle: {
    fontSize: 18,
    opacity: .8,
    marginBottom: 16,
  },
  classGroupsContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
})