import { products } from "@/data/catalogue";

export const availableProducts = products;

export const trendingProducts = products.filter((product) => product.featured).slice(0, 4);
