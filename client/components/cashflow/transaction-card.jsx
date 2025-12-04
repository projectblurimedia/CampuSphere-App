import { View, StyleSheet } from 'react-native'
import { ThemedText } from '@/components/ui/themed-text'
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons'

export default function TransactionCard({ transaction, colors, dashboardColors }) {
  
  const getTransactionIcon = (category, type) => {
    if (type === 'income') {
      switch(category) {
        case 'Tuition Fees':
          return <FontAwesome5 name="graduation-cap" size={16} color="#fff" />
        case 'Admission Fees':
          return <MaterialIcons name="school" size={18} color="#fff" />
        case 'Donations':
          return <FontAwesome5 name="hand-holding-heart" size={16} color="#fff" />
        default:
          return <MaterialIcons name="attach-money" size={18} color="#fff" />
      }
    } else {
      switch(category) {
        case 'Salaries':
          return <Ionicons name="people" size={18} color="#fff" />
        case 'Infrastructure':
          return <Ionicons name="construct" size={18} color="#fff" />
        case 'Utilities':
          return <Ionicons name="flash" size={18} color="#fff" />
        default:
          return <MaterialIcons name="shopping-cart" size={18} color="#fff" />
      }
    }
  }
  
  const getCategoryColor = (type) => {
    return type === 'income' ? dashboardColors.success : dashboardColors.danger
  }

  const isIncome = transaction.type === 'income'
  const categoryColor = getCategoryColor(transaction.type)

  return (
    <View style={[styles.transactionCard, { 
      backgroundColor: dashboardColors.cardBg, 
      borderColor: dashboardColors.border,
      shadowColor: '#00000040'
    }]}>
      <View style={styles.transactionHeader}>
        <View style={[styles.iconContainer, { backgroundColor: categoryColor }]}>
          {getTransactionIcon(transaction.category, transaction.type)}
        </View>
        <View style={styles.transactionInfo}>
          <ThemedText type="defaultSemiBold" style={{ color: colors.text, fontSize: 15 }}>
            {transaction.description}
          </ThemedText>
          <ThemedText style={{ color: colors.icon, fontSize: 12 }}>
            {transaction.category} • {transaction.date}
          </ThemedText>
        </View>
        <ThemedText style={[
          styles.amountText,
          { color: isIncome ? dashboardColors.success : dashboardColors.danger }
        ]}>
          {isIncome ? '+' : '-'}₹{transaction.amount?.toLocaleString('en-IN') || '0'}
        </ThemedText>
      </View>
      
      <View style={styles.transactionFooter}>
        <View style={styles.paymentInfo}>
          <Ionicons name={transaction.paymentMethod === 'Cash' ? "cash" : "card"} 
            size={14} color={colors.icon} />
          <ThemedText style={{ color: colors.icon, fontSize: 12, marginLeft: 6 }}>
            {transaction.paymentMethod} • {transaction.reference}
          </ThemedText>
        </View>
        <View style={[styles.statusBadge, { 
          backgroundColor: transaction.status === 'Completed' ? 
            dashboardColors.success + '20' : 
            dashboardColors.warning + '20' 
        }]}>
          <ThemedText style={{ 
            fontSize: 11, 
            fontWeight: '600',
            color: transaction.status === 'Completed' ? 
              dashboardColors.success : 
              dashboardColors.warning
          }}>
            {transaction.status}
          </ThemedText>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  transactionCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 12,
  },
  transactionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  amountText: {
    fontSize: 16,
    fontWeight: '700',
  },
  transactionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
})