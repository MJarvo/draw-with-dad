// Run once: node make-icons.mjs
// Generates public/icon-192.png and public/icon-512.png
// Requires: npm install canvas  (only needed during setup, not in the app)

import { createCanvas } from "canvas";
import { writeFileSync } from "fs";

function drawIcon(size) {
  const c = createCanvas(size, size);
  const ctx = c.getContext("2d");
  const s = size / 100;

  // Background
  ctx.fillStyle = "#0f0f1e";
  ctx.beginPath();
  ctx.roundRect(0, 0, size, size, size * 0.18);
  ctx.fill();

  // Palette circle
  ctx.fillStyle = "#1e1e3a";
  ctx.beginPath();
  ctx.arc(50 * s, 52 * s, 36 * s, 0, Math.PI * 2);
  ctx.fill();

  // Rainbow arc segments
  const colors = ["#E53935","#FF9800","#FFD600","#4CAF50","#2196F3","#7C4DFF"];
  colors.forEach((col, i) => {
    const r = (28 - i * 4) * s;
    ctx.strokeStyle = col;
    ctx.lineWidth = 3.5 * s;
    ctx.beginPath();
    ctx.arc(50 * s, 60 * s, r, Math.PI, 0);
    ctx.stroke();
  });

  // Paintbrush
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 3 * s;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(68 * s, 28 * s);
  ctx.lineTo(78 * s, 18 * s);
  ctx.stroke();
  ctx.fillStyle = "#FF9800";
  ctx.beginPath();
  ctx.ellipse(64 * s, 32 * s, 5 * s, 8 * s, -Math.PI / 4, 0, Math.PI * 2);
  ctx.fill();

  return c.toBuffer("image/png");
}

writeFileSync("public/icon-192.png", drawIcon(192));
writeFileSync("public/icon-512.png", drawIcon(512));
console.log("Icons written to public/");
