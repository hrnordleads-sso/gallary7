/**
 * Gallery 7 asset registry.
 * Primary: locally hosted copies under ./assets (GitHub Pages /gallary7/ safe).
 * CDN fallbacks used only if a local file fails (see soda-model-ux.js).
 */
(function (global) {
  const LOCAL = {
    can: "assets/deit_soda2.glb",
    cherry: "assets/cherry.glb",
    blueberry: "assets/blueberry.glb",
    leaves: "assets/leaves.glb",
    bubble: "assets/bubble.png",
    greenTexture: "assets/green-base-color.jpg",
    blueTexture: "assets/blue-base-color.jpg",
    greenPng: "assets/green-soda.png",
    bluePng: "assets/blue-soda.png",
  };

  const CDN = {
    can: "https://api.getlayers.ai/storage/v1/object/public/public/assets/soda-14ff8a788d/deit_soda2.glb",
    cherry: "https://api.getlayers.ai/storage/v1/object/public/public/assets/soda-14ff8a788d/cherry.glb",
    blueberry: "https://api.getlayers.ai/storage/v1/object/public/public/assets/soda-14ff8a788d/blueberry.glb",
    leaves: "https://api.getlayers.ai/storage/v1/object/public/public/assets/soda-14ff8a788d/leaves.glb",
    bubble: "https://api.getlayers.ai/storage/v1/object/public/public/assets/soda-14ff8a788d/bubble.png",
    greenTexture: "https://api.getlayers.ai/storage/v1/object/public/public/assets/soda-14ff8a788d/green%20base%20color.jpg",
    blueTexture: "https://api.getlayers.ai/storage/v1/object/public/public/assets/soda-14ff8a788d/blue%20base%20color.jpg",
    greenPng: "https://api.getlayers.ai/storage/v1/object/public/public/assets/soda-14ff8a788d/Green%20Soda.png",
    bluePng: "https://api.getlayers.ai/storage/v1/object/public/public/assets/soda-14ff8a788d/Blue%20Soda.png",
  };

  function cdnFor(localPath) {
    const key = Object.keys(LOCAL).find((k) => LOCAL[k] === localPath);
    return key ? CDN[key] : null;
  }

  global.SodaAssets = Object.freeze({
    ...LOCAL,
    cdn: Object.freeze({ ...CDN }),
    cdnFor,
    themes: {
      classic: {
        inner: "#0b8a78",
        mid: "#044e3b",
        outer: "#011411",
        berry: LOCAL.cherry,
        poster: LOCAL.greenPng,
        label: "Diet Classic",
        price: "$2.99",
      },
      blue: {
        inner: "#0b4f8a",
        mid: "#04294e",
        outer: "#010c14",
        berry: LOCAL.blueberry,
        poster: LOCAL.bluePng,
        label: "Zero Lime",
        price: "$2.99",
      },
    },
  });
})(window);
