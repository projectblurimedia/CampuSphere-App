import { useState } from 'react'
import { 
  StyleSheet, 
  View, 
  ScrollView, 
  FlatList,
  useColorScheme
} from 'react-native'
import { ThemedText } from '@/components/themed-text'
import { Colors } from '@/constants/theme'
import { SafeAreaView } from 'react-native-safe-area-context'
import StaffHeader from '@/components/staff/staff-header'
import StaffSearchBar from '@/components/staff/search-bar'
import StaffStatsCards from '@/components/staff/stats-cards'
import StaffCard from '@/components/staff/staff-card'
import DepartmentFilter from '@/components/staff/department-filter'

// Mock staff data
const staffData = [
  {
    id: '1',
    name: 'Dr. Rajesh Kumar',
    designation: 'Principal',
    department: 'Administration',
    type: 'Teaching',
    contact: '+91 9876543201',
    email: 'rajesh.kumar@school.edu',
    qualification: 'Ph.D. in Education',
    experience: '15 years',
    status: 'Present',
    joiningDate: '2015-06-15'
  },
  {
    id: '2',
    name: 'Mrs. Priya Sharma',
    designation: 'Vice Principal',
    department: 'Administration',
    type: 'Teaching',
    contact: '+91 9876543202',
    email: 'priya.sharma@school.edu',
    qualification: 'M.Ed., M.Sc.',
    experience: '12 years',
    status: 'Present',
    joiningDate: '2016-03-10'
  },
  {
    id: '3',
    name: 'Mr. Amit Patel',
    designation: 'Physics Teacher',
    department: 'Science',
    type: 'Teaching',
    contact: '+91 9876543203',
    email: 'amit.patel@school.edu',
    qualification: 'M.Sc. Physics',
    experience: '8 years',
    status: 'Present',
    joiningDate: '2018-07-22'
  },
  {
    id: '4',
    name: 'Ms. Sneha Reddy',
    designation: 'Mathematics Teacher',
    department: 'Mathematics',
    type: 'Teaching',
    contact: '+91 9876543204',
    email: 'sneha.reddy@school.edu',
    qualification: 'M.Sc. Mathematics',
    experience: '6 years',
    status: 'On Leave',
    joiningDate: '2019-04-05'
  },
  {
    id: '5',
    name: 'Mr. Rohan Verma',
    designation: 'Chemistry Teacher',
    department: 'Science',
    type: 'Teaching',
    contact: '+91 9876543205',
    email: 'rohan.verma@school.edu',
    qualification: 'M.Sc. Chemistry',
    experience: '7 years',
    status: 'Present',
    joiningDate: '2017-08-14'
  },
  {
    id: '6',
    name: 'Mrs. Anjali Mehta',
    designation: 'English Teacher',
    department: 'Languages',
    type: 'Teaching',
    contact: '+91 9876543206',
    email: 'anjali.mehta@school.edu',
    qualification: 'M.A. English',
    experience: '10 years',
    status: 'Present',
    joiningDate: '2016-11-30'
  },
  {
    id: '7',
    name: 'Mr. Vikram Singh',
    designation: 'Accountant',
    department: 'Accounts',
    type: 'Non-Teaching',
    contact: '+91 9876543207',
    email: 'vikram.singh@school.edu',
    qualification: 'M.Com, CA',
    experience: '9 years',
    status: 'Present',
    joiningDate: '2017-02-18'
  },
  {
    id: '8',
    name: 'Mrs. Meera Kapoor',
    designation: 'Librarian',
    department: 'Library',
    type: 'Non-Teaching',
    contact: '+91 9876543208',
    email: 'meera.kapoor@school.edu',
    qualification: 'M.Lib.',
    experience: '5 years',
    status: 'Absent',
    joiningDate: '2020-01-10'
  },
  {
    id: '9',
    name: 'Mr. Sanjay Gupta',
    designation: 'Lab Assistant',
    department: 'Science',
    type: 'Non-Teaching',
    contact: '+91 9876543209',
    email: 'sanjay.gupta@school.edu',
    qualification: 'B.Sc.',
    experience: '4 years',
    status: 'Present',
    joiningDate: '2021-03-25'
  },
  {
    id: '10',
    name: 'Mrs. Sunita Rao',
    designation: 'Office Assistant',
    department: 'Administration',
    type: 'Non-Teaching',
    contact: '+91 9876543210',
    email: 'sunita.rao@school.edu',
    qualification: 'B.Com',
    experience: '3 years',
    status: 'Present',
    joiningDate: '2022-06-12'
  },
]

// Extract unique departments
const allDepartments = ['All', ...new Set(staffData.map(staff => staff.department))]

export default function Staff() {
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme ?? 'light']
  const isDark = colorScheme === 'dark'
  
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

  const filteredStaff = staffData.filter(staff => {
    // Search filter
    const matchesSearch = searchQuery
      ? staff.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        staff.designation.toLowerCase().includes(searchQuery.toLowerCase()) ||
        staff.department.toLowerCase().includes(searchQuery.toLowerCase())
      : true
    
    // Department filter
    const matchesDepartment = selectedDepartment === 'All' || staff.department === selectedDepartment
    
    return matchesSearch && matchesDepartment
  })

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StaffHeader colors={colors} dashboardColors={dashboardColors} />
      
      <StaffSearchBar 
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        colors={colors}
        dashboardColors={dashboardColors}
      />

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <StaffStatsCards 
          staffData={staffData}
          colors={colors}
          dashboardColors={dashboardColors}
        />

        {/* Department Filter */}
        <DepartmentFilter 
          departments={allDepartments.filter(dept => dept !== 'All')}
          selectedDepartment={selectedDepartment}
          setSelectedDepartment={setSelectedDepartment}
          colors={colors}
          dashboardColors={dashboardColors}
        />

        {/* Results Header */}
        <View style={styles.resultsHeader}>
          <ThemedText type='subtitle' style={[styles.resultsTitle, { color: colors.text }]}>
            {selectedDepartment === 'All' ? 'All Staff' : selectedDepartment}
            {' '}({filteredStaff.length}) 
          </ThemedText>
          <ThemedText style={[styles.resultsSubtitle, { color: colors.icon }]}>
            Sorted by: Latest
          </ThemedText>
        </View>

        {/* Staff List */}
        <FlatList
          data={filteredStaff}
          renderItem={({ item }) => (
            <StaffCard 
              staff={item} 
              colors={colors} 
              dashboardColors={dashboardColors} 
            />
          )}
          keyExtractor={item => item.id}
          scrollEnabled={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <ThemedText style={[styles.emptyText, { color: colors.icon }]}>
                No staff members found
              </ThemedText>
              <ThemedText style={[styles.emptySubtext, { color: colors.icon }]}>
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
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  resultsTitle: {
    fontSize: 18,
    opacity: .8,
  },
  resultsSubtitle: {
    fontSize: 13,
    opacity: 0.8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
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