
/**
 * Project schema
 */

import {Schema} from 'mongoose';
import statuses from './statuses';

export default {
  'title':        { type: String, required: true },
  'domain':       String,
  'description':  { type: String },

  'money': { type: Number, required: true },
  'desc': { type: String, required: true },
  'motivation': { type: String, required: true },
  'existed': { type: String, required: true },
  'problem': { type: String, required: true },
  'solution': { type: String, required: true },
  'why': { type: String, required: true },
  'ta': { type: String, required: true },
  'similar': { type: String, required: true },
  'refdesign': { type: String, required: true },
  'pastprj': { type: String, required: true },
  'cowork': { type: String, required: true },
  'usetime': { type: String, required: true },
  'spending': { type: String, required: true },
  'feedback': { type: String, required: true },
  'product': { type: String, required: true },
  'milestone1': { type: String, required: true },
  'milestone2': { type: String, required: true },
  'future': { type: String, required: true },
  'otherfund': { type: String, required: true },
  'category': { type: String, required: true },
  'slide': { type: String },

  'revisions':    { type: [{ description: String, timestamp: Date }], select: false },
  'leader':       { type: Schema.ObjectId, required: true, ref: 'User' },
  'status':       { type: String, enum: statuses, default: statuses[0] },
  'contributors': [{ type: Schema.ObjectId, ref: 'User'}],
  'followers':    [{ type: Schema.ObjectId, ref: 'User'}],
  'awarded':      { type: Boolean, default: false },
  'finalist':     { type: Boolean, default: false },
  'cover':        String,
  'link':         String,
  'tags':         [String],
  'updated_at':   { type: Date, default: Date.now },
  'created_at':   { type: Date, default: Date.now }
};
