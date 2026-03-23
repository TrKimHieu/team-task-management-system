const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
  res.json({ message: "Test route working" });
});

module.exports = router;

/**
 * @swagger
 * /test:
 *   get:
 *     summary: Test API
 *     responses:
 *       200:
 *         description: Success
 */