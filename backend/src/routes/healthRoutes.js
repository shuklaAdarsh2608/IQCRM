import express from "express";

const router = express.Router();

router.get("/", (req, res) => {
  res.json({
    success: true,
    message: "IQLead API is running"
  });
});

export { router as healthRouter };

