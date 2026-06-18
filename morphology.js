const imageUpload = document.getElementById('imageUpload');
const morphSelect = document.getElementById('morphSelect');
const seSelect = document.getElementById('seSelect');
const seGrid = document.getElementById('seGrid');

const canvasOriginal = document.getElementById('canvasOriginal');
const ctxOriginal = canvasOriginal.getContext('2d');
const canvasProcessed = document.getElementById('canvasProcessed');
const ctxProcessed = canvasProcessed.getContext('2d');

let originalImageData = null;
let binaryData = null; // 1D array storing 0 or 255
let imgWidth = 0;
let imgHeight = 0;

// Structuring Elements (1 means we care about this pixel, 0 means ignore)
const structuringElements = {
    square: [
        1, 1, 1,
        1, 1, 1,
        1, 1, 1
    ],
    cross: [
        0, 1, 0,
        1, 1, 1,
        0, 1, 0
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
            // Cap image size for performance
            const MAX_WIDTH = 500;
            imgWidth = img.width;
            imgHeight = img.height;
            if (imgWidth > MAX_WIDTH) {
                imgHeight = Math.floor(imgHeight * (MAX_WIDTH / imgWidth));
                imgWidth = MAX_WIDTH;
            }

            canvasOriginal.width = imgWidth; canvasOriginal.height = imgHeight;
            canvasProcessed.width = imgWidth; canvasProcessed.height = imgHeight;

            ctxOriginal.drawImage(img, 0, 0, imgWidth, imgHeight);
            originalImageData = ctxOriginal.getImageData(0, 0, imgWidth, imgHeight);
            
            // Convert to Binary immediately (Morphology requires binary 0 or 1 images)
            binarizeImage();
            updateUI();
        }
        img.src = event.target.result;
    }
    reader.readAsDataURL(file);
});

// 2. Handle Controls
morphSelect.addEventListener('change', updateUI);
seSelect.addEventListener('change', updateUI);

function updateUI() {
    const seName = seSelect.value;
    const se = structuringElements[seName];

    // Display the Structuring Element visually
    seGrid.innerHTML = '';
    se.forEach(val => {
        const span = document.createElement('span');
        span.textContent = val;
        span.style.background = val === 1 ? '#2c3e50' : '#fff';
        span.style.color = val === 1 ? '#fff' : '#ccc';
        seGrid.appendChild(span);
    });

    if (binaryData) {
        applyMorphology();
    }
}

// 3. Convert Image to Binary (Thresholding at 127)
function binarizeImage() {
    const src = originalImageData.data;
    binaryData = new Uint8Array(imgWidth * imgHeight);
    
    for (let i = 0; i < src.length; i += 4) {
        // Standard grayscale conversion
        let gray = 0.299 * src[i] + 0.587 * src[i+1] + 0.114 * src[i+2];
        let binaryVal = gray > 127 ? 255 : 0; // White is 255, Black is 0
        
        binaryData[i/4] = binaryVal;
        
        // Overwrite original canvas to show the binarized version
        src[i] = binaryVal; src[i+1] = binaryVal; src[i+2] = binaryVal;
    }
    ctxOriginal.putImageData(originalImageData, 0, 0);
}

// 4. The Morphological Engine
function applyMorphology() {
    const op = morphSelect.value;
    const se = structuringElements[seSelect.value];
    let resultData = binaryData;

    // Apply the specific formulas
    if (op === 'erosion') {
        resultData = erode(binaryData, se);
    } else if (op === 'dilation') {
        resultData = dilate(binaryData, se);
    } else if (op === 'opening') {
        // Opening = Erosion followed by Dilation
        let eroded = erode(binaryData, se);
        resultData = dilate(eroded, se);
    } else if (op === 'closing') {
        // Closing = Dilation followed by Erosion
        let dilated = dilate(binaryData, se);
        resultData = erode(dilated, se);
    }

    // Paint the resulting 1D binary array back to the 2D RGBA Canvas
    const outputImgData = ctxProcessed.createImageData(imgWidth, imgHeight);
    const dst = outputImgData.data;
    for (let i = 0; i < resultData.length; i++) {
        let val = resultData[i];
        let ptr = i * 4;
        dst[ptr] = val;     // R
        dst[ptr+1] = val;   // G
        dst[ptr+2] = val;   // B
        dst[ptr+3] = 255;   // Alpha
    }
    ctxProcessed.putImageData(outputImgData, 0, 0);
}

// Core Operations
function dilate(srcData, se) {
    const dstData = new Uint8Array(imgWidth * imgHeight);
    // Dilation is a Local Maximum filter. If ANY pixel under the SE is 255, output is 255.
    for (let y = 1; y < imgHeight - 1; y++) {
        for (let x = 1; x < imgWidth - 1; x++) {
            let isWhite = false;
            for (let cy = -1; cy <= 1; cy++) {
                for (let cx = -1; cx <= 1; cx++) {
                    if (se[(cy+1)*3 + (cx+1)] === 1) {
                        if (srcData[(y + cy) * imgWidth + (x + cx)] === 255) {
                            isWhite = true;
                        }
                    }
                }
            }
            dstData[y * imgWidth + x] = isWhite ? 255 : 0;
        }
    }
    return dstData;
}

function erode(srcData, se) {
    const dstData = new Uint8Array(imgWidth * imgHeight);
    // Erosion is a Local Minimum filter. ALL pixels under the SE must be 255 for output to be 255.
    for (let y = 1; y < imgHeight - 1; y++) {
        for (let x = 1; x < imgWidth - 1; x++) {
            let keepWhite = true;
            for (let cy = -1; cy <= 1; cy++) {
                for (let cx = -1; cx <= 1; cx++) {
                    if (se[(cy+1)*3 + (cx+1)] === 1) {
                        if (srcData[(y + cy) * imgWidth + (x + cx)] === 0) {
                            keepWhite = false;
                        }
                    }
                }
            }
            dstData[y * imgWidth + x] = keepWhite ? 255 : 0;
        }
    }
    return dstData;
}