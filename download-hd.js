// Descarga todas las imagenes HD con Referer correcto
const https = require('https');
const fs = require('fs');
const path = require('path');

const imgDir = path.join(__dirname, 'img', 'hd');
if (!fs.existsSync(imgDir)) fs.mkdirSync(imgDir, { recursive: true });

const images = [
  'https://www.hunterdouglas.com.ar/wp-content/uploads/2025/10/HD.Cortina-Silhouette-5-1024x677.jpg',
  'https://www.hunterdouglas.com.ar/wp-content/uploads/2025/10/Hunter-Douglas.Paneles-Orientales-living.webp',
  'https://www.hunterdouglas.com.ar/wp-content/uploads/2025/10/HunterDouglas-white-logo3-03.svg',
  'https://www.hunterdouglas.com.ar/wp-content/uploads/2025/10/X9A7814-scaled-qucqr83sz3rgxtup48ewldx68rc4apcil2w1us5j8y.jpg',
  'https://www.hunterdouglas.com.ar/wp-content/uploads/2025/10/folding-pergola-hunter-douglas-grandes-dimensoes.webp',
  'https://www.hunterdouglas.com.ar/wp-content/uploads/2025/10/inovacao-001.webp',
  'https://www.hunterdouglas.com.ar/wp-content/uploads/2025/10/stobag_cobertura_modular.webp',
  'https://www.hunterdouglas.com.ar/wp-content/uploads/2025/10/toldo-proyectante-hunter-douglasjpg-optimized.webp',
  'https://www.hunterdouglas.com.ar/wp-content/uploads/2025/11/cortinas-luminette-para-hall.8b48cd-optimized.webp',
  'https://www.hunterdouglas.com.ar/wp-content/uploads/2025/11/etapa-3-toldo-green-hunter-douglas-1.jpg',
  'https://www.hunterdouglas.com.ar/wp-content/uploads/2025/11/toldo-gemini-autoportante.375994-optimized.webp',
  'https://www.hunterdouglas.com.ar/wp-content/uploads/2025/12/cortinas-roller-shadesign-living-clasico-hunterdouglas.17bb53-optimized.webp',
  'https://www.hunterdouglas.com.ar/wp-content/uploads/2025/12/toldo-proyectante-negro-jardinjpg-optimized.webp',
  'https://www.hunterdouglas.com.ar/wp-content/uploads/2026/02/cortinas-verticales-screenjpg-optimized.webp',
  'https://www.hunterdouglas.com.ar/wp-content/uploads/2026/02/horizontales-de-maderajpg-optimized.webp',
  'https://www.hunterdouglas.com.ar/wp-content/uploads/2026/03/HUNTER-DOUGLAS-EXPERIENCIA-LIVING-by-RITVU-185.webp',
  'https://www.hunterdouglas.com.ar/wp-content/uploads/2026/04/Cortina-Luminette-Hunter-Douglas.jpeg',
  'https://www.hunterdouglas.com.ar/wp-content/uploads/2026/04/LeticiaRocco_ExperienciaLiving2026_Foto@ritvu_Silhouette_01.webp',
  'https://www.hunterdouglas.com.ar/wp-content/uploads/2026/04/PersianaAluminio_37.webp',
  'https://www.hunterdouglas.com.ar/wp-content/uploads/2026/04/SandyCairncross_ExperienciaLiving2026_Foto@ritvu_CountryWoods_Duette_02.webp',
  'https://www.hunterdouglas.com.ar/wp-content/uploads/2026/04/cortina-luminette-3.jpg',
  'https://www.hunterdouglas.com.ar/wp-content/uploads/2026/04/cortina-silhouette-11.jpg',
  'https://www.hunterdouglas.com.ar/wp-content/uploads/2026/04/persiana-metais-preciosos-jogo-de-luz-scaled-1.webp',
  'https://www.hunterdouglas.com.ar/wp-content/uploads/2026/04/primeira-persiana-de-aluminio-hunter-douglas.jpg',
  'https://www.hunterdouglas.com.ar/wp-content/uploads/2026/04/stobag_campo_pergolado.webp',
  'https://www.hunterdouglas.com.ar/wp-content/uploads/2026/06/cortinas-twinline-negrasjpg-optimized-2.webp',
  'https://www.hunterdouglas.com.ar/wp-content/uploads/2026/06/pergolas-autoportantepng-optimized.webp',
  'https://www.hunterdouglas.com.ar/wp-content/uploads/2026/06/toldo-zip-ledjpg-optimized-1.webp',
  'https://www.hunterdouglas.com.ar/wp-content/uploads/2026/06/toldo-zip-ledjpg-optimized-2.webp',
  'https://www.hunterdouglas.com.ar/wp-content/uploads/2026/07/cortinas-duette-detalle-tela-hunter-douglas-optimized.webp',
  'https://www.hunterdouglas.com.ar/wp-content/uploads/2026/07/cortinas-duette-hunter-douglas_4-optimized.webp',
  'https://www.hunterdouglas.com.ar/wp-content/uploads/2026/07/cortinas-pirouette-detalle-tela-hunter-douglas-optimized.webp',
  'https://www.hunterdouglas.com.ar/wp-content/uploads/2026/07/cortinas-pirouette-estudiopng-optimized.webp',
  'https://www.hunterdouglas.com.ar/wp-content/uploads/2026/07/cortinas-roller-shadesign-infantilesjpg-optimized.webp',
  'https://www.hunterdouglas.com.ar/wp-content/uploads/2026/07/cortinas-roller-superior-living-hunterdouglasjpg-optimized.webp',
  'https://www.hunterdouglas.com.ar/wp-content/uploads/2026/07/cortinas-silhouette-detalle-tela-hunter-douglas-optimized.webp',
  'https://www.hunterdouglas.com.ar/wp-content/uploads/2026/07/cortinas-silhouette-hunter-douglas_7-optimized.webp',
  'https://www.hunterdouglas.com.ar/wp-content/uploads/2026/07/cortinas-twinline-living-hunter-douglasjpg-optimized.webp',
  'https://www.hunterdouglas.com.ar/wp-content/uploads/2026/07/cortinas-verticales-para-living-hunterdouglasjpg-optimized.webp',
  'https://www.hunterdouglas.com.ar/wp-content/uploads/2026/07/ettes-cortinas-pirouette-hunter-douglas-optimized.webp',
];

const hdrs = {
  'Referer': 'https://www.hunterdouglas.com.ar/',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/125.0 Safari/537.36'
};

function download(url) {
  return new Promise((resolve, reject) => {
    const fname = path.basename(url);
    const dest = path.join(imgDir, fname);
    if (fs.existsSync(dest) && fs.statSync(dest).size > 0) {
      console.log('  Ya existe: ' + fname);
      return resolve();
    }
    const file = fs.createWriteStream(dest);
    https.get(url, { headers: hdrs }, (res) => {
      if (res.statusCode !== 200) {
        file.close();
        fs.unlinkSync(dest);
        return reject(new Error('HTTP ' + res.statusCode));
      }
      res.pipe(file);
      file.on('finish', () => { file.close(); console.log('  OK: ' + fname); resolve(); });
    }).on('error', (err) => {
      file.close();
      try { fs.unlinkSync(dest); } catch(e) {}
      reject(err);
    });
  });
}

(async () => {
  console.log('Descargando ' + images.length + ' imagenes...');
  let ok = 0, fail = 0;
  for (const url of images) {
    try { await download(url); ok++; }
    catch (e) { console.error('  FAIL: ' + path.basename(url) + ' - ' + e.message); fail++; }
  }
  console.log('\n=== Listo: ' + ok + ' OK, ' + fail + ' errores ===');
  console.log('Ahora ejecuta fix-and-push.bat');
})();
