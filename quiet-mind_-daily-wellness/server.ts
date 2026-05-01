import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    
    app.get('*', (req, res) => {
      const indexPath = path.join(distPath, 'index.html');
      let html = fs.readFileSync(indexPath, 'utf8');
      
      // Check for script data in URL
      const data = req.query.s as string;
      if (data) {
        try {
          const script = JSON.parse(Buffer.from(data, 'base64').toString('utf8'));
          const title = `Quiet Mind: ${script.hook}`;
          const description = script.metaphor;
          const imageUrl = "https://picsum.photos/seed/quietmind/1200/630";
          const url = `${req.protocol}://${req.get('host')}${req.originalUrl}`;

          // Replace meta tags
          html = html.replace(/<title>.*?<\/title>/, `<title>${title}</title>`);
          html = html.replace(/<meta name="description" content=".*?" \/>/, `<meta name="description" content="${description}" />`);
          
          // Inject OG tags if they don't exist, or replace them
          const ogTags = `
            <meta property="og:type" content="website" />
            <meta property="og:url" content="${url}" />
            <meta property="og:title" content="${title}" />
            <meta property="og:description" content="${description}" />
            <meta property="og:image" content="${imageUrl}" />
            <meta property="twitter:card" content="summary_large_image" />
            <meta property="twitter:url" content="${url}" />
            <meta property="twitter:title" content="${title}" />
            <meta property="twitter:description" content="${description}" />
            <meta property="twitter:image" content="${imageUrl}" />
          `;
          html = html.replace('</head>', `${ogTags}</head>`);
        } catch (e) {
          console.error("Failed to parse script data for meta tags", e);
        }
      }
      
      res.send(html);
    });
  }

  // API routes can go here if needed
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
