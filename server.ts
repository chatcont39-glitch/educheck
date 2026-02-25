import express from "express";
import { createServer as createViteServer } from "vite";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  // Ensure storage directory exists
  const storageDir = path.join(__dirname, 'storage');
  if (!fs.existsSync(storageDir)) {
    fs.mkdirSync(storageDir);
  }

  // API Routes
  app.post("/api/save-pdf", (req, res) => {
    const { fileName, pdfBase64 } = req.body;
    if (!fileName || !pdfBase64) {
      return res.status(400).json({ error: "Missing data" });
    }

    const filePath = path.join(storageDir, fileName);
    const buffer = Buffer.from(pdfBase64, 'base64');

    fs.writeFile(filePath, buffer, (err) => {
      if (err) {
        console.error("Error saving PDF:", err);
        return res.status(500).json({ error: "Failed to save PDF" });
      }
      res.json({ message: "PDF saved successfully", path: filePath });
    });
  });

  app.get("/api/history", (req, res) => {
    fs.readdir(storageDir, (err, files) => {
      if (err) {
        return res.status(500).json({ error: "Failed to read history" });
      }
      const history = files.filter(f => f.endsWith('.pdf')).map(f => ({
        name: f,
        date: fs.statSync(path.join(storageDir, f)).mtime
      }));
      res.json(history);
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
