
/**
 * Project schema
 */

import {Schema} from 'mongoose';
import statuses from './statuses';

export default {
  'title':        { type: String, required: true },
  'domain':       String,
  'description':  { type: String, required: true },
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
