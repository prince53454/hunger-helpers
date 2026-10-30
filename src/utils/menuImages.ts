import trufflePasta from '../assets/images/dish_truffle_pasta_1793287332343.jpg';
import woodfiredPizza from '../assets/images/dish_woodfired_pizza_1793287333703.jpg';
import wagyuBurger from '../assets/images/dish_wagyu_burger_1793287333993.jpg';
import berryTiramisu from '../assets/images/dish_berry_tiramisu_1793287334194.jpg';

const bundledMenuImages: Record<string, string> = {
  'dish_truffle_pasta_1793287332343.jpg': trufflePasta,
  'dish_woodfired_pizza_1793287333703.jpg': woodfiredPizza,
  'dish_wagyu_burger_1793287333993.jpg': wagyuBurger,
  'dish_berry_tiramisu_1793287334194.jpg': berryTiramisu,
};

/** Resolve legacy source-asset paths to Vite-bundled URLs and keep public image paths intact. */
export function getMenuImage(image: string | undefined): string {
  if (!image?.trim()) return '';

  const normalized = image.trim().replace(/\\/g, '/');
  const sourceAsset = normalized.match(/(?:^|\\/)src\\/assets\\/images\\/([^?#]+)/i);
  if (sourceAsset) {
    return bundledMenuImages[sourceAsset[1]] ?? '';
  }

  return normalized;
}
