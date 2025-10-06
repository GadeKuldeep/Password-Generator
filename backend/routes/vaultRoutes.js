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
    const { ciphertext, iv, salt } = req.body;
    if (!ciphertext || !iv || !salt) return res.status(400).json({ message: "Missing fields" });

    const item = new VaultItem({
      ownerId: req.user._id,
      ciphertext,
      iv,
      salt
    });
    await item.save();
    res.json(item);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// PUT /api/vault/:id - update
router.put("/:id", async (req, res) => {
  try {
    const { ciphertext, iv, salt } = req.body;
    const item = await VaultItem.findOne({ _id: req.params.id, ownerId: req.user._id });
    if (!item) return res.status(404).json({ message: "Not found" });

    item.ciphertext = ciphertext || item.ciphertext;
    item.iv = iv || item.iv;
    item.salt = salt || item.salt;
    item.updatedAt = new Date();
    await item.save();
    res.json(item);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE /api/vault/:id
router.delete("/:id", async (req, res) => {
  try {
    const item = await VaultItem.findOneAndDelete({ _id: req.params.id, ownerId: req.user._id });
    if (!item) return res.status(404).json({ message: "Not found" });
    res.json({ message: "Deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
