// DOM Elements
const imageUpload = document.getElementById('imageUpload');
const filterSelect = document.getElementById('filterSelect');
const kernelGrid = document.getElementById('kernelGrid');

const canvasOriginal = document.getElementById('canvasOriginal');
const ctxOriginal = canvasOriginal.getContext('2d');
const canvasProcessed = document.getElementById('canvasProcessed');
const ctxProcessed = canvasProcessed.getContext('2d');

let originalImageData = null;

// Standard 3x3 Kernels used in Computer Vision
const kernels = {
    original: [
        0, 0, 0,
        0, 1, 0,
        0, 0, 0
    ],
    mean: [
        1/9, 1/9, 1/9,
        1/9, 1/9, 1/9,
        1/9, 1/9, 1/9
    ],
    gaussian: [
        1/16, 2/16, 1/16,
        2/16, 4/16, 2/16,
        1/16, 2/16, 1/16
    ],
    laplacian: [
        0,  1,  0,
        1, -4,  1,
        0,  1,  0
    ],
    sobelX: [
       -1,  0,  1,
       -2,  0,  2,
       -1,  0,  1
    ],
    sobelY: [
       -1, -2, -1,
        0,  0,  0,
        1,  2,  1
    ]
};

// 1. Handle Image Upload
imageUpload.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(event) {
        const img = new Image();
        img.onload = function() {
            // Cap image size to prevent the browser from freezing during heavy O(n^2) convolution math
            const MAX_WIDTH = 600;
            let width = img.width;
            let height = img.height;
            if (width > MAX_WIDTH) {
                height = Math.floor(height * (MAX_WIDTH / width));
                width = MAX_WIDTH;
            }

            canvasOriginal.width = width; canvasOriginal.height = height;
            canvasProcessed.width = width; canvasProcessed.height = height;

            ctxOriginal.drawImage(img, 0, 0, width, height);
            originalImageData = ctxOriginal.getImageData(0, 0, width, height);
            
            updateUI();
        }
        img.src = event.target.result;
    }
    reader.readAsDataURL(file);
});

// 2. Handle Dropdown Changes
filterSelect.addEventListener('change', updateUI);

function updateUI() {
    const filterName = filterSelect.value;
    const kernel = kernels[filterName];

    // Display the Matrix in the UI
    kernelGrid.innerHTML = '';
    kernel.forEach(val => {
        const span = document.createElement('span');
        // Format fractions nicely for display
        span.textContent = Number.isInteger(val) ? val : (val).toFixed(2);
        kernelGrid.appendChild(span);
    });

    if (originalImageData) {
        applyConvolution(kernel);
    }
}

// 3. The Convolution Engine
function applyConvolution(kernel) {
    const width = originalImageData.width;
    const height = originalImageData.height;
    const src = originalImageData.data;
    
    // Create new blank image data for output
    const outputData = ctxProcessed.createImageData(width, height);
    const dst = outputData.data;

    const side = Math.round(Math.sqrt(kernel.length)); // 3
    const halfSide = Math.floor(side / 2); // 1

    // Loop through every pixel in the image (ignoring the 1px edge to prevent out-of-bounds errors)
    for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
            
            const dstOff = (y * width + x) * 4;
            let r = 0, g = 0, b = 0;

            // Slide the 3x3 kernel over the current pixel
            for (let cy = 0; cy < side; cy++) {
                for (let cx = 0; cx < side; cx++) {
                    const scy = y + cy - halfSide;
                    const scx = x + cx - halfSide;
                    const srcOff = (scy * width + scx) * 4;
                    const weight = kernel[cy * side + cx];

                    r += src[srcOff] * weight;
                    g += src[srcOff + 1] * weight;
                    b += src[srcOff + 2] * weight;
                }
            }

            // Edge detection (Laplacian/Sobel) can result in negative numbers. 
            // We use Math.abs to keep the edges visible and clamp at 255.
            dst[dstOff] = Math.min(Math.max(Math.abs(r), 0), 255);
            dst[dstOff + 1] = Math.min(Math.max(Math.abs(g), 0), 255);
            dst[dstOff + 2] = Math.min(Math.max(Math.abs(b), 0), 255);
            dst[dstOff + 3] = 255; // Alpha channel (fully opaque)
        }
    }

    // Paint the convolved image to the screen
    ctxProcessed.putImageData(outputData, 0, 0);
}