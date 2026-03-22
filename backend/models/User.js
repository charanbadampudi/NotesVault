const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username:     { type: String, required: true, unique: true, trim: true, minlength: 3, maxlength: 30 },
  email:        { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:     { type: String, required: true, minlength: 8, select: false },
  passcodeHash: { type: String, default: null, select: false },
  passcodeSet:  { type: Boolean, default: false },
  // How many digits the vault passcode is (4–6)
  passcodeLength: { type: Number, default: 4, min: 4, max: 6 },
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = function (c) { return bcrypt.compare(c, this.password); };
userSchema.methods.comparePasscode = function (c) { return bcrypt.compare(c, this.passcodeHash); };

module.exports = mongoose.model('User', userSchema);
