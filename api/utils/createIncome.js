import prisma from '../lib/prisma.js'

const ensureIncomeCategoryExists = async (tx = null) => {
  console.log('🔍 ensureIncomeCategoryExists started')
  try {
    const client = tx || prisma
    
    let schoolCategory = await client.category.findFirst({
      where: {
        name: 'School',
        type: 'INCOME'
      }
    })

    if (!schoolCategory) {
      console.log('Creating School category...')
      schoolCategory = await client.category.create({
        data: {
          name: 'School',
          type: 'INCOME'
        }
      })
    }

    let studentFeeItem = await client.item.findFirst({
      where: {
        name: 'Student Fee',
        categoryId: schoolCategory.id
      }
    })

    if (!studentFeeItem) {
      console.log('Creating Student Fee item...')
      studentFeeItem = await client.item.create({
        data: {
          name: 'Student Fee',
          categoryId: schoolCategory.id
        }
      })
    }

    return {
      categoryId: schoolCategory.id,
      itemId: studentFeeItem.id
    }
  } catch (error) {
    console.error('❌ Error in ensureIncomeCategoryExists:', error)
    throw error
  }
}

const mapPaymentMethod = (method) => {
  console.log('Mapping payment method:', method)
  const methodMap = {
    'CASH': 'CASH',
    'CHEQUE': 'CHEQUE',
    'BANK_TRANSFER': 'BANK_TRANSFER',
    'ONLINE_PAYMENT': 'ONLINE',
    'ONLINE': 'ONLINE',
    'CARD': 'CREDIT_CARD',
    'CREDIT_CARD': 'CREDIT_CARD',
    'OTHER': 'OTHER'
  }
  const mapped = methodMap[method] || 'CASH'
  console.log('Mapped to:', mapped)
  return mapped
}

export const createIncome = async ({
  tx,
  studentName,  
  amount,
  paymentMode,
  receivedBy,   
  receiptNo
}) => {
  
  try {
    if (!tx) {
      throw new Error('Transaction object (tx) is required but was not provided')
    }

    const { categoryId, itemId } = await ensureIncomeCategoryExists(tx)
    
    const cashFlow = await tx.cashFlow.create({
      data: {
        type: 'INCOME',
        categoryId,
        itemId,
        amount,
        quantity: 1,
        person: receivedBy,           
        description: `Student Fee - ${studentName} (Receipt: ${receiptNo})`,
        date: new Date(),
        paymentMethod: mapPaymentMethod(paymentMode),
        updatedBy: receivedBy,           
      }
    })

    return cashFlow
  } catch (error) {
    console.error('❌ Error in createIncome:', error)
    console.error('Error stack:', error.stack)
    throw error
  }
}

export default createIncome