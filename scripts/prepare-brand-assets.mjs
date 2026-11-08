import sharp from 'sharp';

const medallion = 'src/assets/brand/source/goose-medallion.webp';
const banner = 'src/assets/brand/source/pub-banner.webp';

await sharp(medallion)
  .extract({ left: 175, top: 100, width: 905, height: 1035 })
  .resize({ width: 560, withoutEnlargement: true })
  .png({ compressionLevel: 9, palette: true })
  .toFile('src/assets/brand/goose-emblem.png');

await sharp('src/assets/brand/goose-emblem.png')
  .resize({ width: 128, height: 128, fit: 'contain', background: '#011307' })
  .png({ compressionLevel: 9, palette: true })
  .toFile('public/images/favicon.png');

await sharp(banner)
  .resize({ width: 1120, height: 426, fit: 'contain', withoutEnlargement: true })
  .extend({ top: 102, bottom: 102, left: 40, right: 40, background: '#031c15' })
  .png({ compressionLevel: 9, palette: true })
  .toFile('public/images/social-card.png');

const image = sharp(medallion);
const samples = {
  forest: [80, 80],
  ivory: [545, 345],
  brass: [616, 155],
  burgundy: [625, 850],
};

for (const [name, [left, top]] of Object.entries(samples)) {
  const { data, info } = await image.clone().extract({ left, top, width: 9, height: 9 }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const channels = [0, 1, 2].map(channel => {
    let total = 0;
    for (let index = channel; index < data.length; index += info.channels) total += data[index];
    return Math.round(total / (data.length / info.channels));
  });
  console.log(`${name}: #${channels.map(value => value.toString(16).padStart(2, '0')).join('')}`);
}
