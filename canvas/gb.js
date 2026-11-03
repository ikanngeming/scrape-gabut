const { createCanvas, loadImage, GlobalFonts } = require('@napi-rs/canvas');
const { resolve } = require('node:path');
const { readFile, writeFile } = require('node:fs/promises');

const here = __dirname;

function fitText(ctx, value, maxWidth) {
  const text = String(value ?? '');
  if (ctx.measureText(text).width <= maxWidth) return text;
  const ellipsis = '…';
  let result = text;
  while (result.length > 0 && ctx.measureText(result + ellipsis).width > maxWidth) {
    result = result.slice(0, -1);
  }
  return result ? result + ellipsis : ellipsis;
}

async function main(namaGroup, sambutan, text, waktu, outputFile = 'canvas-redrawn.png') {
  if (sambutan !== 'WELCOME' && sambutan !== 'GOODBYE') {
    throw new Error('sambutan hanya bisa WELCOME atau GOODBYE');
  }

  const outputPath = resolve(here, outputFile);
  const avatar = await loadImage(await readFile(resolve(here, 'assets/avatar.png')));
  GlobalFonts.registerFromPath(resolve(here, 'assets/DejaVuSans-Bold.ttf'), 'CanvasSans');

  const W = 640, H = 360;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');
  const groupText = String(namaGroup ?? '');
  const welcomeText = String(text ?? '');
  const waktu = String(waktu ?? '');

  function roundedRect(x, y, w, h, r, fill, stroke, lineWidth = 1) {
    ctx.beginPath(); ctx.roundRect(x, y, w, h, r);
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.lineWidth = lineWidth; ctx.strokeStyle = stroke; ctx.stroke(); }
  }

  // Background and purple glow.
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#18181b'); bg.addColorStop(.68, '#17171a'); bg.addColorStop(1, '#31203c');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
  const glow = ctx.createRadialGradient(320, 360, 4, 320, 360, 360);
  glow.addColorStop(0, 'rgba(174,76,204,.9)');
  glow.addColorStop(.5, 'rgba(117,53,153,.62)');
  glow.addColorStop(1, 'rgba(93,44,122,0)');
  ctx.fillStyle = glow; ctx.fillRect(0, 225, W, 135);

  // Main dark panel.
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.55)'; ctx.shadowBlur = 16; ctx.shadowOffsetY = 5;
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(W, 0); ctx.lineTo(W, 274);
  ctx.quadraticCurveTo(W, 304, W - 29, 304); ctx.lineTo(29, 304);
  ctx.quadraticCurveTo(0, 304, 0, 274); ctx.closePath();
  ctx.fillStyle = '#08090d'; ctx.fill(); ctx.restore();

  // Header labels: size the group pill from measured glyph width, capped before the member pill.
  ctx.font = 'bold 12px CanvasSans, sans-serif';
  const groupMaxWidth = 445; // leaves a gap before the fixed member badge at x=514
  const displayGroup = fitText(ctx, groupText, groupMaxWidth);
  const groupPillWidth = Math.min(472, Math.ceil(ctx.measureText(displayGroup).width + 20));
  roundedRect(22, 20, groupPillWidth, 26, 13, '#202126', '#45464a', 1);
  roundedRect(514, 20, 120, 26, 13, '#202126', '#45464a', 1);
  ctx.fillStyle = '#e5e5e6'; ctx.textBaseline = 'middle';
  ctx.fillText(displayGroup, 32, 33);
  ctx.beginPath(); ctx.arc(528, 33, 2.1, 0, Math.PI * 2);
  ctx.fillStyle = '#d7d7d8'; ctx.fill();
  ctx.font = 'bold 12px CanvasSans, sans-serif';
  ctx.fillText('1  MEMBERS', 540, 33);

  // Avatar and circular borders.
  ctx.beginPath(); ctx.arc(320, 117, 70, 0, Math.PI * 2); ctx.fillStyle = '#111216'; ctx.fill();
  ctx.beginPath(); ctx.arc(320, 117, 65, 0, Math.PI * 2); ctx.lineWidth = 2; ctx.strokeStyle = '#f1f1f2'; ctx.stroke();
  ctx.beginPath(); ctx.arc(320, 117, 71, 0, Math.PI * 2); ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(210,210,214,.45)'; ctx.stroke();
  ctx.save(); ctx.beginPath(); ctx.arc(320, 117, 63, 0, Math.PI * 2); ctx.clip();
  ctx.drawImage(avatar, 265, 62, 110, 110); ctx.restore();

  // Main title.
  ctx.save(); ctx.translate(320, 223); ctx.scale(.60, 1);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#f7f7f8';
  ctx.font = 'bold 56px CanvasSans, sans-serif'; ctx.fillText(sambutan, 0, 0); ctx.restore();
  ctx.fillStyle = '#f6f6f7'; ctx.fillRect(298, 256, 44, 2);

  // Message card: constrain message to the inner card width so it cannot bleed outside.
  roundedRect(60, 272, 520, 61, 12, '#08090d', '#45464a', 1);
  ctx.font = '13px CanvasSans, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ededee';
  ctx.fillText(fitText(ctx, welcomeText, 480), 320, 303);
  ctx.font = 'bold 11px CanvasSans, sans-serif'; ctx.fillStyle = '#85868c';
  ctx.fillText(waktu, 320, 345);

  await writeFile(outputPath, canvas.toBuffer('image/png'));
  console.log(`Wrote ${outputPath} (${W}×${H})`);
}

// Example call. Change the group name and greeting as needed.
main('ikann group bot', 'WELCOME', "Let's enjoy with us!", '07 OKT 2026 · 18.10')
  .catch((error) => { console.error(error); process.exitCode = 1; });
