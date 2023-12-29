/**
 * @typedef {Object} Vector2 - 2D vector representation
 * @property {number} x - x-coordinate
 * @property {number} y - y-coordinate
 */
class Vector2 {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
}

/**
 * @class Noise
 * @description Represents a Perlin noise generator
 */
class Noise {
  /**
   * @constructor
   */
  constructor() {
    /** @type {number} */
    this.w = 8 * 32; // No precomputed gradients mean this works for any number of grid coordinates
  }

  /**
   * Generates a random gradient vector at given grid coordinates.
   * @param {number} ix - x-coordinate of the grid
   * @param {number} iy - y-coordinate of the grid
   * @returns {Vector2} - A random gradient vector
   */
  randomGradient(ix, iy) {
    /** @type {number} */
    const s = this.w / 2; // rotation width
    /** @type {number} */
    let a = ix,
      b = iy;
    a *= 3284157443;
    b ^= (a << s) | (a >>> (this.w - s));
    b *= 1911520717;
    a ^= (b << s) | (b >>> (this.w - s));
    a *= 2048419325;
    /** @type {number} */
    const random = a * (Math.PI / ~(0xffffffff >>> 1)); // in [0, 2*PI]
    /** @type {Vector2} */
    const v = new Vector2(Math.cos(random), Math.sin(random));
    return v;
  }

  /**
   * Computes the dot product of the distance and gradient vectors.
   * @param {number} ix - x-coordinate of the grid
   * @param {number} iy - y-coordinate of the grid
   * @param {number} x - x-coordinate
   * @param {number} y - y-coordinate
   * @returns {number} - Dot product result
   */
  dotGridGradient(ix, iy, x, y) {
    /** @type {Vector2} */
    const gradient = this.randomGradient(ix, iy);

    /** @type {number} */
    const dx = x - ix;
    /** @type {number} */
    const dy = y - iy;

    /** @type {number} */
    return dx * gradient.x + dy * gradient.y;
  }

  /**
   * Linearly interpolates between two values.
   * @param {number} a0 - First value
   * @param {number} a1 - Second value
   * @param {number} w - Interpolation weight
   * @returns {number} - Interpolated value
   */
  interpolate(a0, a1, w) {
    // You may want clamping here
    return (a1 - a0) * w + a0;
  }

  /**
   * Computes Perlin noise at coordinates (x, y).
   * @param {number} x - x-coordinate
   * @param {number} y - y-coordinate
   * @returns {number} - Perlin noise value
   */
  perlin(x, y) {
    /** @type {number} */
    const x0 = Math.floor(x);
    /** @type {number} */
    const x1 = x0 + 1;
    /** @type {number} */
    const y0 = Math.floor(y);
    /** @type {number} */
    const y1 = y0 + 1;

    /** @type {number} */
    const sx = x - x0;
    /** @type {number} */
    const sy = y - y0;

    /** @type {number} */
    let n0, n1, ix0, ix1, value;

    n0 = this.dotGridGradient(x0, y0, x, y);
    n1 = this.dotGridGradient(x1, y0, x, y);
    ix0 = this.interpolate(n0, n1, sx);

    n0 = this.dotGridGradient(x0, y1, x, y);
    n1 = this.dotGridGradient(x1, y1, x, y);
    ix1 = this.interpolate(n0, n1, sx);

    value = this.interpolate(ix0, ix1, sy);
    return value; // Will return in range -1 to 1. To make it in range 0 to 1, multiply by 0.5 and add 0.5
  }
}

// Create Noise instance
const noiseHandler = new Noise();

// Get canvas element
const canvas = document.getElementById("Terrain");
const ctx = canvas.getContext("2d");

// Define thresholds for each lake
const thresholds = [-0.3, -0.4, -0.5]; // Adjust these thresholds for different land and lake sizes

// Define cartoony colors for land and water
const landColor = "#6EB043"; // Greenish color for land
const waterColor = "#4AB9FF"; // Blue color for water

// Settings

// Get the slider elements
const sliderX = document.getElementById("noiseValueX");
const sliderY = document.getElementById("noiseValueY");

// Initialize variables to store noise multipliers
let noiseMultiplierX = sliderX.value;
let noiseMultiplierY = sliderY.value;

// Add event listeners to update noise multipliers when sliders change
sliderX.addEventListener("input", function () {
  noiseMultiplierX = parseFloat(sliderX.value);
});

sliderY.addEventListener("input", function () {
  noiseMultiplierY = parseFloat(sliderY.value);
});

// Get generate button element
const GenerateButton = document.getElementById("GenerateBtn");

GenerateButton.addEventListener("click", function() { 
    generate();
})

function generate() {
  // Iterate through the canvas pixels and set water color based on Perlin noise
  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      let isWater = false;

      // Get Perlin noise value for the current coordinates
      for (let i = 0; i < thresholds.length; i++) {
        const perlinValue = noiseHandler.perlin(x * noiseMultiplierX, y * noiseMultiplierY);
        if (perlinValue < thresholds[i]) {
          isWater = true;
          break;
        }
      }

      // Set color based on whether it's water or land
      if (isWater) {
        ctx.fillStyle = waterColor; // Set water color
      } else {
        const perlinValue = noiseHandler.perlin(x * 0.01, y * 0.01); // Different noise scale for land
        const colorValue = Math.floor((perlinValue + 1) * 127); // Convert noise value to a grayscale color value
        const r = colorValue + 50;
        const g = colorValue + 100;
        const b = colorValue + 50;
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`; // Set cartoony land color based on noise
      }

      ctx.fillRect(x, y, 1, 1); // Draw a single pixel
    }
  }
}
generate();