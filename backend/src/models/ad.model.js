const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  userName: { type: String },
  userEmail: { type: String },
  comment: { type: String },
  rating: { type: Number, min: 1, max: 5, required: true },
}, { timestamps: true });


const AdSchema = new mongoose.Schema(
  {
    advertiserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    productName:{type:String,required:true},
    imageUrl: { type: String, required: true },
    description: { type: String, required: true },
    adType: { type: String, required: true },
    tags: {
      type: [String],
      default: [], // can be empty
    },
    targetAgeGroup: {
      min: { type: Number, required: true },
      max: { type: Number, required: true },
    },
    views: { type: Number, default: 0 },
    price: { type: Number, default: 0 },

    feedbacks: [feedbackSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Ad', AdSchema);
