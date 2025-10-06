import mongoose from "mongoose";

const VaultItemSchema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  ciphertext: { type: String, required: true }, // base64
  iv: { type: String, required: true }, // base64
  salt: { type: String, required: true }, // base64 - we store user's encSalt or per-item if you change design
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model("VaultItem", VaultItemSchema);
