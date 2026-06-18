const imageUpload = document.getElementById('imageUpload');
const segmentSelect = document.getElementById('segmentSelect');
const paramRegion = document.getElementById('paramRegion');
const paramKMeans = document.getElementById('paramKMeans');
const toleranceSlider = document.getElementById('toleranceSlider');
const tolValue = document.getElementById('tolValue');
const kSlider = document.getElementById('kSlider');
const kValue = document.getElementById('kValue');
const runKMeansBtn = document.getElementById('runKMeans');

const canvasOriginal = document.getElementById('canvasOriginal');
const ctxOriginal = canvasOriginal.getContext('2d');
const canvasProcessed = document.getElementById('canvasProcessed');
const ctxProcessed = canvasProcessed.getContext('2d');

let originalImageData = null;
let imgWidth = 0;
let imgHeight = 0;

// 1. Handle Image Upload
imageUpload.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(event) {
        const img = new Image();
        img.onload = function() {
            // Cap image size significantly because K-Means and Region Growing are computationally heavy
            const MAX_WIDTH = 300; 
            imgWidth = img.width;
            imgHeight = img.height;
            if (imgWidth > MAX_WIDTH) {
                imgHeight = Math.floor(imgHeight * (MAX_WIDTH / imgWidth));
                imgWidth = MAX_WIDTH;
            }

            canvasOriginal.width = imgWidth; canvasOriginal.height = imgHeight;
            canvasProcessed.width = imgWidth; canvasProcessed.height = imgHeight;

            ctxOriginal.drawImage(img, 0, 0, imgWidth, imgHeight);
            ctxProcessed.drawImage(img, 0, 0, imgWidth, imgHeight);
            
            originalImageData = ctxOriginal.getImageData(0, 0, imgWidth, imgHeight);
            updateUI();
        }
        img.src = event.target.result;
    }
    reader.readAsDataURL(file);
});

// 2. Handle UI
segmentSelect.addEventListener('change', updateUI);
toleranceSlider.addEventListener('input', () => { tolValue.textContent = toleranceSlider.value; });
kSlider.addEventListener('input', () => { kValue.textContent = kSlider.value; });

function updateUI() {
    const algo = segmentSelect.value;
    paramRegion.style.display = algo === 'region' ? 'block' : 'none';
    paramKMeans.style.display = algo === 'kmeans' ? 'block' : 'none';

    if (algo === 'original' && originalImageData) {
        ctxProcessed.putImageData(originalImageData, 0, 0);
    }
}

// 3. REGION GROWING (Triggered by Clicking the Canvas)
canvasOriginal.addEventListener('mousedown', function(e) {
    if (segmentSelect.value !== 'region' || !originalImageData) return;

    // Get click coordinates relative to canvas
    const rect = canvasOriginal.getBoundingClientRect();
    const x = Math.floor(e.clientX - rect.left);
    const y = Math.floor(e.clientY - rect.top);

    runRegionGrowing(x, y, parseInt(toleranceSlider.value));
});

function colorDistance(r1, g1, b1, r2, g2, b2) {
    // Simple Euclidean distance in RGB space
    return Math.sqrt(Math.pow(r1-r2, 2) + Math.pow(g1-g2, 2) + Math.pow(b1-b2, 2));
}

function runRegionGrowing(startX, startY, tolerance) {
    const src = originalImageData.data;
    const outputData = ctxProcessed.createImageData(imgWidth, imgHeight);
    const dst = outputData.data;
    
    // Create a visited array to track processed pixels
    const visited = new Uint8Array(imgWidth * imgHeight);
    
    // Get seed color
    const seedIndex = (startY * imgWidth + startX) * 4;
    const seedR = src[seedIndex], seedG = src[seedIndex+1], seedB = src[seedIndex+2];

    // BFS Queue
    const queue = [[startX, startY]];
    visited[startY * imgWidth + startX] = 1;

    // Output starts completely black
    for (let i = 0; i < dst.length; i += 4) {
        dst[i] = 0; dst[i+1] = 0; dst[i+2] = 0; dst[i+3] = 255;
    }

    const neighbors = [[-1, 0], [1, 0], [0, -1], [0, 1]]; // 4-way connectivity

    while (queue.length > 0) {
        const [cx, cy] = queue.shift();
        
        // Color the output pixel (Make the region stand out, e.g., bright green)
        const ptr = (cy * imgWidth + cx) * 4;
        dst[ptr] = src[ptr];         // Keep original R
        dst[ptr+1] = 255;            // Boost G to highlight segment
        dst[ptr+2] = src[ptr+2];     // Keep original B

        // Check neighbors
        for (let i = 0; i < neighbors.length; i++) {
            const nx = cx + neighbors[i][0];
            const ny = cy + neighbors[i][1];

            if (nx >= 0 && nx < imgWidth && ny >= 0 && ny < imgHeight) {
                const nIdx = ny * imgWidth + nx;
                if (!visited[nIdx]) {
                    const srcPtr = nIdx * 4;
                    const dist = colorDistance(seedR, seedG, seedB, src[srcPtr], src[srcPtr+1], src[srcPtr+2]);
                    
                    if (dist <= tolerance) {
                        visited[nIdx] = 1;
                        queue.push([nx, ny]);
                    }
                }
            }
        }
    }
    ctxProcessed.putImageData(outputData, 0, 0);
}

// 4. K-MEANS CLUSTERING (Triggered by Button)
runKMeansBtn.addEventListener('click', function() {
    if (!originalImageData) return;
    
    const K = parseInt(kSlider.value);
    const maxIterations = 5; // Kept low to prevent browser freezing
    const src = originalImageData.data;
    
    // Initialize random centroids
    let centroids = [];
    for (let i = 0; i < K; i++) {
        const randIdx = Math.floor(Math.random() * (imgWidth * imgHeight)) * 4;
        centroids.push({r: src[randIdx], g: src[randIdx+1], b: src[randIdx+2]});
    }

    let labels = new Array(imgWidth * imgHeight);

    // K-Means Iterations
    for (let iter = 0; iter < maxIterations; iter++) {
        let sums = Array.from({length: K}, () => ({r: 0, g: 0, b: 0, count: 0}));

        // Assign pixels to nearest centroid
        for (let i = 0; i < src.length; i += 4) {
            let r = src[i], g = src[i+1], b = src[i+2];
            let minDist = Infinity;
            let clusterIdx = 0;

            for (let c = 0; c < K; c++) {
                let dist = colorDistance(r, g, b, centroids[c].r, centroids[c].g, centroids[c].b);
                if (dist < minDist) {
                    minDist = dist;
                    clusterIdx = c;
                }
            }
            labels[i/4] = clusterIdx;
            sums[clusterIdx].r += r; sums[clusterIdx].g += g; sums[clusterIdx].b += b;
            sums[clusterIdx].count++;
        }

        // Update centroids
        for (let c = 0; c < K; c++) {
            if (sums[c].count > 0) {
                centroids[c].r = sums[c].r / sums[c].count;
                centroids[c].g = sums[c].g / sums[c].count;
                centroids[c].b = sums[c].b / sums[c].count;
            }
        }
    }

    // Paint segmented image based on final centroids
    const outputData = ctxProcessed.createImageData(imgWidth, imgHeight);
    const dst = outputData.data;
    for (let i = 0; i < labels.length; i++) {
        let cluster = labels[i];
        let ptr = i * 4;
        dst[ptr] = centroids[cluster].r;
        dst[ptr+1] = centroids[cluster].g;
        dst[ptr+2] = centroids[cluster].b;
        dst[ptr+3] = 255;
    }
    ctxProcessed.putImageData(outputData, 0, 0);
});