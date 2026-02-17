import { View, StyleSheet, TouchableOpacity } from 'react-native'
import { ThemedText } from '@/components/ui/themed-text'
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons'
import { useTheme } from '@/hooks/useTheme'

export default function TransactionCard({ transaction }) {
  const { colors } = useTheme()
  
  const getTransactionIcon = (category, type) => {
    const categoryLower = (category || '').toLowerCase()
    
    if (type === 'Income') {
      if (categoryLower.includes('tuition') || categoryLower.includes('fee')) {
        return <FontAwesome5 name="graduation-cap" size={16} color="#fff" />
      } else if (categoryLower.includes('admission')) {
        return <MaterialIcons name="school" size={18} color="#fff" />
      } else if (categoryLower.includes('donation')) {
        return <FontAwesome5 name="hand-holding-heart" size={16} color="#fff" />
      } else if (categoryLower.includes('transport')) {
        return <Ionicons name="bus" size={18} color="#fff" />
      } else if (categoryLower.includes('exam')) {
        return <Ionicons name="document-text" size={18} color="#fff" />
      }
      return <MaterialIcons name="attach-money" size={18} color="#fff" />
    } else {
      if (categoryLower.includes('salary')) {
        return <Ionicons name="people" size={18} color="#fff" />
      } else if (categoryLower.includes('infrastructure')) {
        return <Ionicons name="construct" size={18} color="#fff" />
      } else if (categoryLower.includes('utilit')) {
        return <Ionicons name="flash" size={18} color="#fff" />
      } else if (categoryLower.includes('stationery')) {
        return <FontAwesome5 name="book" size={16} color="#fff" />
      } else if (categoryLower.includes('maintenance')) {
        return <MaterialIcons name="build" size={18} color="#fff" />
      }
      return <MaterialIcons name="shopping-cart" size={18} color="#fff" />
    }
  }
  
  const getCategoryColor = (type) => {
    return type === 'Income' ? colors.success : colors.danger
  }

  const isIncome = transaction.type === 'Income'
  const categoryColor = getCategoryColor(transaction.type)

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  const formatPaymentMethod = (method) => {
    if (!method) return 'Cash'
    return method.replace('_', ' ').replace(/\w\S*/g, txt => 
      txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    )
  }

  return (
    <TouchableOpacity 
      activeOpacity={0.7}
      style={[styles.transactionCard, { 
        backgroundColor: colors.cardBackground, 
        borderColor: colors.border,
        shadowColor: colors.text
      }]}
    >
      <View style={styles.transactionHeader}>
        <View style={[styles.iconContainer, { backgroundColor: categoryColor }]}>
          {getTransactionIcon(transaction.category?.name || transaction.category, transaction.type)}
        </View>
        <View style={styles.transactionInfo}>
          <ThemedText type="defaultSemiBold" style={{ color: colors.text, fontSize: 15 }} numberOfLines={1}>
            {transaction.description || `${transaction.category?.name || 'Transaction'} - ${formatDate(transaction.date)}`}
          </ThemedText>
          <ThemedText style={{ color: colors.textSecondary, fontSize: 12 }}>
            {transaction.category?.name || 'Unknown'} • {formatDate(transaction.date)}
          </ThemedText>
        </View>
        <ThemedText style={[
          styles.amountText,
          { color: isIncome ? colors.success : colors.danger }
        ]}>
          {isIncome ? '+' : '-'}₹{(transaction.amount || 0).toLocaleString('en-IN')}
        </ThemedText>
      </View>
      
      <View style={styles.transactionFooter}>
        <View style={styles.paymentInfo}>
          <Ionicons 
            name={transaction.paymentMethod === 'Cash' ? "cash" : "card"} 
            size={14} 
            color={colors.textSecondary} 
          />
          <ThemedText style={{ color: colors.textSecondary, fontSize: 12, marginLeft: 6 }} numberOfLines={1}>
            {formatPaymentMethod(transaction.paymentMethod)} • {transaction.person || 'System'}
          </ThemedText>
        </View>
        {transaction.quantity > 1 && (
          <View style={[styles.quantityBadge, { backgroundColor: colors.primary + '20' }]}>
            <ThemedText style={{ 
              fontSize: 11, 
              fontWeight: '600',
              color: colors.primary
            }}>
              Qty: {transaction.quantity}
            </ThemedText>
          </View>
        )}
      </View>
    </TouchableOpacity>
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
    elevation: .5,
    marginBottom: 8,
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
    marginRight: 8,
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
    flex: 1,
  },
  quantityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 8,
  },
})