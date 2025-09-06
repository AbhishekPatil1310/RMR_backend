const { Schema, model, mongoose } = require('mongoose');
const bcrypt = require('bcryptjs');


const userSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false,
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true, // Allows multiple null values
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    age: {
      type: Number
    },
    interests: {
      type: [String],
      enum: ['sports', 'music', 'movies', 'travel', 'gaming', 'reading', 'cooking', 'art', 'technology'],
      default: [],
    },
    time: {
      type: [String],
      enum: ['morning', 'afternoon', 'evening', 'night'],
      default: [],
    },
    role: {
      type: String,
      enum: ['user', 'advertiser', 'admin'],
      default: 'user',
    },
    ban: {
      isBanned: { type: Boolean, default: false },
      bannedUntil: { type: Date, default: null }
    },
    credit: {
      type: Number,
      default: 0,
      min: 0, // Ensure credit cannot be negative
    },
    totalSpent: {
      type: Number,
      rewuired: true,
      default: 0
    },
    monthlySpent: {
      type: Number,
      default: 0
    },
    lastSpentReset: {
      type: Date,
      default: Date.now
    }, cart: [
      {
        ad: { type: mongoose.Schema.Types.ObjectId, ref: "Ad" },
        addedAt: Date,
        price: Number,
        quantity: Number
      }
    ],
    address: [
      {
        label: { type: String, trim: true }, // optional label like "Home" or "Work"
        city: { type: String, trim: true, required: true },
        state: { type: String, trim: true, required: true },
        postalCode: { type: String, trim: true, required: true },
        mobileNo: { type: String, trim: true, required: true },
      }
    ],
    orders: [
      {
        orderID: { type: Number },
        ad: { type: mongoose.Schema.Types.ObjectId, ref: "Ad" },
        total: { type: Number, required: true },
        quantity: { type: Number, required: true },
        orderDate: { type: Date, default: Date.now },
        deliveryAddress: {
          label: { type: String, trim: true },
          city: { type: String, trim: true, required: true },
          state: { type: String, trim: true, required: true },
          postalCode: { type: String, trim: true, required: true },
          mobileNo: { type: String, trim: true, required: true },
        }
      },

    ],


  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  if (this.password === 'google-oauth-user') return next();

  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.isPasswordMatch = function (plain) {
  return bcrypt.compare(plain, this.password);
};

module.exports = model('User', userSchema);
