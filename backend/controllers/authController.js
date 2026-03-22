const bcrypt = require('bcryptjs');
const User   = require('../models/User');
const { signToken } = require('../utils/token');

const sanitize = (user) => ({
  id:             user._id,
  username:       user.username,
  email:          user.email,
  passcodeSet:    user.passcodeSet,
  passcodeLength: user.passcodeLength || 4,
});

exports.register = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;
    const user = await User.create({ username, email, password });
    res.status(201).json({ token: signToken(user._id), user: sanitize(user) });
  } catch (err) { next(err); }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password)))
      return res.status(401).json({ error: 'Invalid email or password.' });
    res.json({ token: signToken(user._id), user: sanitize(user) });
  } catch (err) { next(err); }
};

exports.getMe = (req, res) => res.json({ user: sanitize(req.user) });

// POST /api/auth/set-passcode
exports.setPasscode = async (req, res, next) => {
  try {
    const { passcode } = req.body;
    if (!passcode || !/^\d{4,6}$/.test(passcode))
      return res.status(400).json({ error: 'Passcode must be 4–6 digits.' });

    const hash = await bcrypt.hash(passcode, 10);
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { passcodeHash: hash, passcodeSet: true, passcodeLength: passcode.length },
      { new: true }
    );
    res.json({ user: sanitize(user) });
  } catch (err) { next(err); }
};

// POST /api/auth/verify-passcode
exports.verifyPasscode = async (req, res, next) => {
  try {
    const { passcode } = req.body;
    const user = await User.findById(req.user._id).select('+passcodeHash');
    if (!user.passcodeHash)
      return res.status(400).json({ error: 'No passcode set.' });
    const valid = await user.comparePasscode(passcode);
    if (!valid) return res.status(401).json({ error: 'Incorrect passcode.' });
    res.json({ success: true });
  } catch (err) { next(err); }
};
