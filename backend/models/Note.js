const mongoose = require('mongoose');

const VALID_TAGS = ['personal', 'work', 'finance', 'legal', 'medical'];

const noteSchema = new mongoose.Schema({
  owner:            { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title:            { type: String, required: true, trim: true, maxlength: 200 },
  encryptedContent: { type: String, required: true },
  iv:               { type: String, required: true },
  encryptedPreview: { type: String, default: '' },
  previewIv:        { type: String, default: '' },

  // Encrypted images array — each item: { encryptedData, iv, mimeType, name }
  images: [{
    encryptedData: { type: String, required: true }, // AES-256 encrypted base64
    iv:            { type: String, required: true },
    mimeType:      { type: String, default: 'image/jpeg' },
    name:          { type: String, default: 'image' },
  }],

  tags:           { type: [String], enum: VALID_TAGS, default: [] },
  starred:        { type: Boolean, default: false },
  pinned:         { type: Boolean, default: false },
  color:          { type: String, default: 'default' },
  wordCount:      { type: Number, default: 0 },
  passcodeType:   { type: String, enum: ['default','custom'], default: 'default' },
  customPasscodeHash: { type: String, default: null, select: false },
  passcodeLength: { type: Number, default: 4, min: 4, max: 6 },
  lockMode:       { type: String, enum: ['everyOpen','oncePerSession'], default: 'oncePerSession' },
  deletedAt:      { type: Date, default: null },
}, { timestamps: true });

// Only non-deleted by default
noteSchema.pre(/^find/, function (next) {
  // Allow bypass via .setOptions({ includeDeleted: true })
  if (!this.getOptions().includeDeleted) {
    this.where({ deletedAt: null });
  }
  next();
});

noteSchema.index({ title: 'text' });

module.exports = mongoose.model('Note', noteSchema);
