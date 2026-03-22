const bcrypt = require('bcryptjs');
const Note   = require('../models/Note');

// ── LIST (non-deleted) ────────────────────────────────────────────
exports.listNotes = async (req, res, next) => {
  try {
    const { tag, starred, pinned, search, sort = '-updatedAt' } = req.query;
    const query = { owner: req.user._id };
    if (tag)              query.tags    = tag;
    if (starred === 'true') query.starred = true;
    if (pinned  === 'true') query.pinned  = true;
    if (search)           query.title   = { $regex: search, $options: 'i' };

    const notes = await Note.find(query).sort(sort)
      .select('-encryptedContent -images')
      .lean();
    res.json({ notes });
  } catch (err) { next(err); }
};

// ── LIST TRASH (deleted only) ─────────────────────────────────────
exports.listTrash = async (req, res, next) => {
  try {
    const notes = await Note.find({ owner: req.user._id, deletedAt: { $ne: null } })
      .setOptions({ includeDeleted: true })
      .sort('-deletedAt')
      .select('-encryptedContent -images')
      .lean();
    res.json({ notes });
  } catch (err) { next(err); }
};

// ── GET SINGLE ────────────────────────────────────────────────────
exports.getNote = async (req, res, next) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, owner: req.user._id });
    if (!note) return res.status(404).json({ error: 'Note not found.' });
    res.json({ note });
  } catch (err) { next(err); }
};

// ── CREATE ────────────────────────────────────────────────────────
exports.createNote = async (req, res, next) => {
  try {
    const {
      title, encryptedContent, iv, encryptedPreview, previewIv,
      tags, color, wordCount, images,
      passcodeType, customPasscode, lockMode,
    } = req.body;

    let customPasscodeHash = null;
    let passcodeLength     = 4;

    if (passcodeType === 'custom' && customPasscode) {
      if (!/^\d{4,6}$/.test(customPasscode))
        return res.status(400).json({ error: 'Custom passcode must be 4–6 digits.' });
      customPasscodeHash = await bcrypt.hash(customPasscode, 10);
      passcodeLength     = customPasscode.length;
    } else {
      const User = require('../models/User');
      const user = await User.findById(req.user._id);
      passcodeLength = user.passcodeLength || 4;
    }

    const note = await Note.create({
      owner: req.user._id,
      title, encryptedContent, iv,
      encryptedPreview: encryptedPreview || '',
      previewIv:        previewIv        || '',
      images:           images           || [],
      tags:             tags             || [],
      color:            color            || 'default',
      wordCount:        wordCount        || 0,
      passcodeType:     passcodeType     || 'default',
      customPasscodeHash,
      passcodeLength,
      lockMode:         lockMode         || 'oncePerSession',
    });

    const safe = note.toObject(); delete safe.customPasscodeHash;
    res.status(201).json({ note: safe });
  } catch (err) { next(err); }
};

// ── UPDATE ────────────────────────────────────────────────────────
exports.updateNote = async (req, res, next) => {
  try {
    const allowed = [
      'title','encryptedContent','iv','encryptedPreview','previewIv',
      'images','tags','starred','pinned','color','wordCount','passcodeType','lockMode',
    ];
    const updates = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });

    if (req.body.passcodeType === 'custom' && req.body.customPasscode) {
      if (!/^\d{4,6}$/.test(req.body.customPasscode))
        return res.status(400).json({ error: 'Custom passcode must be 4–6 digits.' });
      updates.customPasscodeHash = await bcrypt.hash(req.body.customPasscode, 10);
      updates.passcodeLength     = req.body.customPasscode.length;
    }
    if (req.body.passcodeType === 'default') {
      updates.customPasscodeHash = null;
      const User = require('../models/User');
      const user = await User.findById(req.user._id);
      updates.passcodeLength = user.passcodeLength || 4;
    }

    const note = await Note.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      updates, { new: true, runValidators: true }
    );
    if (!note) return res.status(404).json({ error: 'Note not found.' });

    const safe = note.toObject(); delete safe.customPasscodeHash;
    res.json({ note: safe });
  } catch (err) { next(err); }
};

// ── SOFT DELETE (move to trash) ───────────────────────────────────
exports.deleteNote = async (req, res, next) => {
  try {
    const note = await Note.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      { deletedAt: new Date() }, { new: true }
    );
    if (!note) return res.status(404).json({ error: 'Note not found.' });
    res.json({ message: 'Note moved to trash.' });
  } catch (err) { next(err); }
};

// ── RESTORE FROM TRASH ────────────────────────────────────────────
exports.restoreNote = async (req, res, next) => {
  try {
    const note = await Note.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id, deletedAt: { $ne: null } },
      { deletedAt: null },
      { new: true, setOptions: { includeDeleted: true } }
    ).setOptions({ includeDeleted: true });
    if (!note) return res.status(404).json({ error: 'Note not found in trash.' });
    res.json({ note });
  } catch (err) { next(err); }
};

// ── PERMANENT DELETE ──────────────────────────────────────────────
exports.hardDeleteNote = async (req, res, next) => {
  try {
    const note = await Note.findOneAndDelete(
      { _id: req.params.id, owner: req.user._id, deletedAt: { $ne: null } }
    ).setOptions({ includeDeleted: true });
    if (!note) return res.status(404).json({ error: 'Note not found in trash.' });
    res.json({ message: 'Note permanently deleted.' });
  } catch (err) { next(err); }
};

// ── EMPTY TRASH ───────────────────────────────────────────────────
exports.emptyTrash = async (req, res, next) => {
  try {
    await Note.deleteMany(
      { owner: req.user._id, deletedAt: { $ne: null } }
    ).setOptions({ includeDeleted: true });
    res.json({ message: 'Trash emptied.' });
  } catch (err) { next(err); }
};

// ── VERIFY PASSCODE ───────────────────────────────────────────────
exports.verifyNotePasscode = async (req, res, next) => {
  try {
    const { passcode } = req.body;
    const note = await Note.findOne({ _id: req.params.id, owner: req.user._id })
      .select('+customPasscodeHash');
    if (!note) return res.status(404).json({ error: 'Note not found.' });

    if (note.passcodeType === 'custom') {
      if (!note.customPasscodeHash)
        return res.status(400).json({ error: 'No custom passcode set.' });
      const valid = await bcrypt.compare(passcode, note.customPasscodeHash);
      if (!valid) return res.status(401).json({ error: 'Incorrect passcode.' });
    }
    res.json({ success: true });
  } catch (err) { next(err); }
};
