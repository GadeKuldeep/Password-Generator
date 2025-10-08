import mongoose from "mongoose";

const VaultItemSchema = new mongoose.Schema({
  ownerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  // Encrypted fields (all encrypted client-side before sending to server)
  title: { 
    type: String, 
    required: true 
  }, // encrypted
  username: { 
    type: String, 
    default: "" 
  }, // encrypted
  password: { 
    type: String, 
    required: true 
  }, // encrypted
  url: { 
    type: String, 
    default: "" 
  }, // encrypted
  notes: { 
    type: String, 
    default: "" 
  }, // encrypted
  
  // Encryption metadata
  iv: { 
    type: String, 
    required: true 
  }, // base64 - initialization vector for this item
  authTag: { 
    type: String, 
    required: true 
  }, // base64 - for AES-GCM authentication
  
  // Timestamps
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Update updatedAt before saving
VaultItemSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model("VaultItem", VaultItemSchema);