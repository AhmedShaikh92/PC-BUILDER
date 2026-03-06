/**
 * Generate search URL for a component
 * @param componentName - Name of the component to search
 * @param region - Amazon region (default: 'in' for India)
 * @returns Amazon search URL
 */
export const getAmazonSearchLink = (
  componentName: string,
  region: "in" | "com" = "in",
): string => {
  // Clean and encode the component name for URL
  const searchQuery = encodeURIComponent(componentName.trim());

  // Amazon domain based on region
  const domain = region === "in" ? "amazon.in" : "amazon.com";

  return `https://www.${domain}/s?k=${searchQuery}`;
};

/**
 * Generate search links for multiple vendors
 */
export const getVendorLinks = (
  componentName: string,
  selectedPrice?: number,
) => {
  const searchQuery = encodeURIComponent(componentName.trim());

  // Added 10% buffer and round to nearest thousand if price provided
  // Example: ₹4939 → ₹5439 → ₹6000
  const priceParam = selectedPrice
    ? Math.ceil((selectedPrice * 1.1) / 1000) * 1000
    : undefined;

  return {
    amazon: priceParam
      ? `https://www.amazon.in/s?k=${searchQuery}&rh=p_36%3A0-${priceParam * 100}`
      : `https://www.amazon.in/s?k=${searchQuery}`,
    flipkart: priceParam
      ? `https://www.flipkart.com/search?q=${searchQuery}&p%5B%5D=facets.price_range.from%3DMin&p%5B%5D=facets.price_range.to%3D${priceParam}`
      : `https://www.flipkart.com/search?q=${searchQuery}`,
    vedant: `https://www.vedantcomputers.com/index.php?route=product/search&search=${searchQuery}`,
    mdcomputers: `https://mdcomputers.in/index.php?route=product/search&search=${searchQuery}`,
    primeabgb: `https://www.primeabgb.com/?s=${searchQuery}`,
  };
};

/**
 * Generate search links for prebuilt PCs based on total build price
 * @param totalPrice - Total price of the build recommendation
 * @returns Vendor search URLs for prebuilt gaming PCs in the price range
 */
export const getPrebuiltPCLinks = (totalPrice: number) => {
  // Add 15% buffer for prebuilt markup and round to nearest thousand
  const maxPrice = Math.ceil((totalPrice * 1.15) / 1000) * 1000;
  const minPrice = Math.floor((totalPrice * 0.85) / 1000) * 1000;

  return {
    amazon: `https://www.amazon.in/s?k=gaming+pc+desktop&rh=p_36%3A${minPrice * 100}-${maxPrice * 100}`,
    flipkart: `https://www.flipkart.com/search?q=gaming+desktop+pc&p%5B%5D=facets.price_range.from%3D${minPrice}&p%5B%5D=facets.price_range.to%3D${maxPrice}`,
    vedant: `https://www.vedantcomputers.com/pc-components/desktops`,
    mdcomputers: `https://mdcomputers.in/build_your_pc/`,
    primeabgb: `https://www.primeabgb.com/buy-online-price-india/pre-built-gaming-pc/?view=list-view&orderby=popularity&view=list-view`,
    tlggaming: `https://tlggaming.com/prebuilt-pc?fmin=49151&fmax=${maxPrice + 2000}`,
  };
};