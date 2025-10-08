import express from "express";
import VaultItem from "../models/VaultItem.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// Protect all vault routes
router.use(authMiddleware);

// GET /api/vault - get all vault items for user
router.get("/", async (req, res) => {
  try {
    const items = await VaultItem.find({ ownerId: req.user._id }).sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/vault - add new encrypted item
router.post("/", async (req, res) => {
  try {
    const { title, username, password, url, notes, iv, authTag } = req.body;
    
    // Validate required fields
    if (!title || !password || !iv || !authTag) {
      return res.status(400).json({ 
        message: "Missing required fields: title, password, iv, and authTag are required" 
      });
    }

    const item = new VaultItem({
      ownerId: req.user._id,
      title,
      username: username || "",
      password,
      url: url || "",
      notes: notes || "",
      iv,
      authTag
    });
    
    await item.save();
    res.status(201).json(item);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// PUT /api/vault/:id - update vault item
router.put("/:id", async (req, res) => {
  try {
    const { title, username, password, url, notes, iv, authTag } = req.body;
    
    const item = await VaultItem.findOne({ _id: req.params.id, ownerId: req.user._id });
    if (!item) {
      return res.status(404).json({ message: "Vault item not found" });
    }

    // Update only provided fields (all encrypted client-side)
    if (title !== undefined) item.title = title;
    if (username !== undefined) item.username = username;
    if (password !== undefined) item.password = password;
    if (url !== undefined) item.url = url;
    if (notes !== undefined) item.notes = notes;
    if (iv !== undefined) item.iv = iv;
    if (authTag !== undefined) item.authTag = authTag;

    // updatedAt will be automatically updated by the pre-save middleware
    await item.save();
    
    res.json(item);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// PATCH /api/vault/:id - partial update (alternative to PUT)
router.patch("/:id", async (req, res) => {
  try {
    const updates = req.body;
    
    const item = await VaultItem.findOne({ _id: req.params.id, ownerId: req.user._id });
    if (!item) {
      return res.status(404).json({ message: "Vault item not found" });
    }

    // Apply updates
    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined) {
        item[key] = updates[key];
      }
    });

    await item.save();
    res.json(item);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/vault/:id - get single vault item
router.get("/:id", async (req, res) => {
  try {
    const item = await VaultItem.findOne({ _id: req.params.id, ownerId: req.user._id });
    if (!item) {
      return res.status(404).json({ message: "Vault item not found" });
    }
    res.json(item);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE /api/vault/:id
router.delete("/:id", async (req, res) => {
  try {
    const item = await VaultItem.findOneAndDelete({ 
      _id: req.params.id, 
      ownerId: req.user._id 
    });
    
    if (!item) {
      return res.status(404).json({ message: "Vault item not found" });
    }
    
    res.json({ 
      message: "Vault item deleted successfully",
      deletedId: item._id 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/vault/search - search vault items (basic search)
router.get("/search/:query", async (req, res) => {
  try {
    const { query } = req.params;
    
    // Note: This searches encrypted data, so it will only match exact encrypted strings
    // For proper search, you'd need to implement client-side decryption and filtering
    // or use deterministic encryption for searchable fields
    const items = await VaultItem.find({ 
      ownerId: req.user._id,
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { username: { $regex: query, $options: 'i' } },
        { url: { $regex: query, $options: 'i' } }
      ]
    }).sort({ createdAt: -1 });
    
    res.json(items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;