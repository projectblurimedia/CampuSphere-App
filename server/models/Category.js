const mongoose = require("mongoose")

const categorySchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    type: {
      type: String,
      enum: ["Income", "Expense"],
      required: true,
      index: true
    }
  },
  { 
    timestamps: true 
  }
)

// Get categories by type
categorySchema.statics.getByType = function(type) {
  return this.find({ type: type }).sort({ name: 1 })
}

module.exports = mongoose.model("Category", categorySchema)