const mongoose = require("mongoose")

const itemSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    }
  },
  { timestamps: true }
)

// Compound index for unique items within category
itemSchema.index({ category: 1, name: 1 }, { 
  unique: true,
  collation: { locale: 'en', strength: 2 }
})

// Get items by category
itemSchema.statics.getByCategory = function(categoryId) {
  return this.find({ 
    category: categoryId 
  }).sort({ name: 1 })
}

module.exports = mongoose.model("Item", itemSchema)