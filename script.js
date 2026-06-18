// DOM Elements
const imageUpload = document.getElementById('imageUpload');
const algorithmSelect = document.getElementById('algorithmSelect');
const parametersDiv = document.getElementById('parameters');
const sliderLabel = document.getElementById('sliderLabel');
const paramSlider = document.getElementById('paramSlider');
const sliderValue = document.getElementById('sliderValue');
const formulaDisplay = document.getElementById('formulaDisplay');

const canvasOriginal = document.getElementById('canvasOriginal');
const ctxOriginal = canvasOriginal.getContext('2d');
const canvasProcessed = document.getElementById('canvasProcessed');
const ctxProcessed = canvasProcessed.getContext('2d');

let originalImageData = null; // Stores the raw pixel data

// 1. Handle Image Upload
imageUpload.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(event) {
        const img = new Image();
        img.onload = function() {
            // Set canvas dimensions to match image
            canvasOriginal.width = img.width;
            canvasOriginal.height = img.height;
            canvasProcessed.width = img.width;
            canvasProcessed.height = img.height;

            // Draw original image
            ctxOriginal.drawImage(img, 0, 0);
            
            // Store original pixel data
            originalImageData = ctxOriginal.getImageData(0, 0, img.width, img.height);
            
            // Run processing immediately
            processImage();
        }
        img.src = event.target.result;
    }
    reader.readAsDataURL(file);
});

// 2. Handle UI Changes (Dropdowns and Sliders)
algorithmSelect.addEventListener('change', updateUI);
paramSlider.addEventListener('input', () => {
    sliderValue.textContent = paramSlider.value;
    processImage();
});

function updateUI() {
    const algo = algorithmSelect.value;
    parametersDiv.style.display = 'flex'; // Show by default, hide if 'original' or 'negation'

    if (algo === 'original' || algo === 'negation') {
        parametersDiv.style.display = 'none';
    } else if (algo === 'thresholding') {
        sliderLabel.textContent = 'Threshold Limit:';
        paramSlider.min = 0; paramSlider.max = 255; paramSlider.step = 1; paramSlider.value = 127;
        formulaDisplay.textContent = 's = 255 if r > T else 0';
    } else if (algo === 'logarithmic') {
        sliderLabel.textContent = 'Log Constant (c):';
        paramSlider.min = 1; paramSlider.max = 100; paramSlider.step = 1; paramSlider.value = 45;
        formulaDisplay.textContent = 's = c * log(1 + r)';
    } else if (algo === 'gamma') {
        sliderLabel.textContent = 'Gamma (γ):';
        paramSlider.min = 0.1; paramSlider.max = 5.0; paramSlider.step = 0.1; paramSlider.value = 1.0;
        formulaDisplay.textContent = 's = c * r^γ';
    }
    
    sliderValue.textContent = paramSlider.value;
    processImage();
}

// 3. The Core Image Processing Engine
function processImage() {
    if (!originalImageData) return;

    const algo = algorithmSelect.value;
    const param = parseFloat(paramSlider.value);
    
    // Create a new blank image data object
    const processedData = ctxProcessed.createImageData(originalImageData.width, originalImageData.height);
    const src = originalImageData.data; // Array of [R, G, B, A, R, G, B, A...]
    const dst = processedData.data;

    // Pre-calculate constants for optimization
    const c_log = param; 
    const c_gamma = 255 / Math.pow(255, param); // Normalization constant for Gamma

    // Loop through every pixel (4 elements per pixel: Red, Green, Blue, Alpha)
    for (let i = 0; i < src.length; i += 4) {
        let r = src[i];
        let g = src[i + 1];
        let b = src[i + 2];
        let a = src[i + 3];

        // Apply Algorithms based on selection
        if (algo === 'original') {
            dst[i] = r; dst[i+1] = g; dst[i+2] = b;
        } 
        else if (algo === 'negation') {
            dst[i] = 255 - r;
            dst[i+1] = 255 - g;
            dst[i+2] = 255 - b;
        } 
        else if (algo === 'thresholding') {
            // Convert to grayscale first for standard thresholding: (R+G+B)/3
            let gray = (r + g + b) / 3;
            let val = gray > param ? 255 : 0;
            dst[i] = val; dst[i+1] = val; dst[i+2] = val;
        } 
        else if (algo === 'logarithmic') {
            dst[i] = c_log * Math.log(1 + r);
            dst[i+1] = c_log * Math.log(1 + g);
            dst[i+2] = c_log * Math.log(1 + b);
        } 
        else if (algo === 'gamma') {
            dst[i] = c_gamma * Math.pow(r, param);
            dst[i+1] = c_gamma * Math.pow(g, param);
            dst[i+2] = c_gamma * Math.pow(b, param);
        }

        dst[i + 3] = a; // Keep original alpha (transparency)
    }

    // Paint the processed pixels onto the canvas
    ctxProcessed.putImageData(processedData, 0, 0);
}