const mongoose = require('mongoose')
const Category = require('../models/Category')
const Item = require('../models/Item')

const seedCategoriesAndItems = async () => {
  // Clear existing data
  await Category.deleteMany({})
  await Item.deleteMany({})
  
  // Create categories
  const expenseCategories = [
    { name: "Transport", type: "Expense" },
    { name: "Food", type: "Expense" },
    { name: "Utilities", type: "Expense" },
    { name: "Salary", type: "Expense" },
    { name: "Rent", type: "Expense" },
    { name: "Maintenance", type: "Expense" }
  ]
  
  const incomeCategories = [
    { name: "Student Fees", type: "Income" },
    { name: "Donations", type: "Income" },
    { name: "Government Grant", type: "Income" },
    { name: "Events", type: "Income" },
    { name: "Services", type: "Income" }
  ]
  
  const savedExpenseCategories = await Category.insertMany(expenseCategories)
  const savedIncomeCategories = await Category.insertMany(incomeCategories)
  
  // Create items for each category
  const itemsData = [
    // Transport items
    ...savedExpenseCategories
      .filter(c => c.name === "Transport")
      .map(category => [
        { name: "Diesel", category: category._id },
        { name: "Bus Repair", category: category._id },
        { name: "Tire Replacement", category: category._id },
        { name: "Insurance", category: category._id }
      ]),
    
    // Food items
    ...savedExpenseCategories
      .filter(c => c.name === "Food")
      .map(category => [
        { name: "Groceries", category: category._id },
        { name: "Restaurant", category: category._id },
        { name: "Snacks", category: category._id }
      ]),
    
    // Student Fees items
    ...savedIncomeCategories
      .filter(c => c.name === "Student Fees")
      .map(category => [
        { name: "Tuition Fee", category: category._id },
        { name: "Admission Fee", category: category._id },
        { name: "Exam Fee", category: category._id }
      ]),
    
    // Donations items
    ...savedIncomeCategories
      .filter(c => c.name === "Donations")
      .map(category => [
        { name: "Corporate Donation", category: category._id },
        { name: "Individual Donation", category: category._id },
        { name: "Alumni Donation", category: category._id }
      ])
  ].flat()
  
  await Item.insertMany(itemsData)
  
  console.log('✅ Categories and items seeded successfully!')
  console.log(`Created ${expenseCategories.length + incomeCategories.length} categories`)
  console.log(`Created ${itemsData.length} items`)
}

module.exports = seedCategoriesAndItems