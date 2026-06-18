# Computer Vision Assignment - Project Summary

## Overview
This is an interactive Computer Vision application built with HTML5, CSS3, and vanilla JavaScript. It demonstrates fundamental image processing techniques across four main modules. All processing is done client-side using Canvas API for real-time visualization.

---

## Project Structure

```
assignment/
├── index.html              # Module 1: Point Processing
├── spatial.html            # Module 2: Spatial Filtering
├── morphology.html         # Module 3: Morphology
├── segmentation.html       # Module 4: Segmentation
├── script.js               # Point Processing logic
├── spatial.js              # Spatial Filtering logic
├── morphology.js           # Morphology logic
├── segmentation.js         # Segmentation logic
├── style.css               # Global styles
└── ComputerVision.md      # This file
```

---

## Module 1: Point Processing (`index.html` / `script.js`)

**Purpose:** Demonstrates pixel-level transformations applied uniformly to every pixel in an image.

### Features:
- **Image Negation**: Inverts all pixel values
- **Thresholding**: Converts image to binary (black and white) using a configurable threshold
- **Logarithmic Transformation**: Enhances details in darker regions
- **Power-Law (Gamma)**: Brightness adjustment via gamma correction

### Technical Details:
- Image upload with automatic resizing (max 500px width)
- Real-time preview of transformations
- Slider control for threshold and gamma parameters
- Formula display for each algorithm

---

## Module 2: Spatial Filtering (`spatial.html` / `spatial.js`)

**Purpose:** Applies 3x3 kernel convolution to detect features and apply filters.

### Features:
- **Mean Blur**: Smoothing using averaging kernel
- **Gaussian Blur**: Weighted smoothing with Gaussian distribution
- **Laplacian Edge Detection**: Detects edges using Laplacian operator
- **Sobel X**: Detects vertical edges
- **Sobel Y**: Detects horizontal edges

### Technical Details:
- 3x3 convolution operation on entire image
- Kernel matrix visualization
- Absolute value clamping for edge detection results
- Performance optimized for images up to 600px width
- Handles negative values from edge detection kernels

### Kernels Used:
```
Mean:        Gaussian:      Laplacian:     Sobel X:       Sobel Y:
1/9 1/9 1/9  1/16 2/16 1/16   0  1  0    -1  0  1    -1 -2 -1
1/9 1/9 1/9  2/16 4/16 2/16   1 -4  1    -2  0  2     0  0  0
1/9 1/9 1/9  1/16 2/16 1/16   0  1  0    -1  0  1     1  2  1
```

---

## Module 3: Morphology (`morphology.html` / `morphology.js`)

**Purpose:** Performs binary image processing operations using structuring elements.

### Features:
- **Erosion (Shrink)**: Local minimum filter - removes small white objects
- **Dilation (Expand)**: Local maximum filter - fills small black holes
- **Opening**: Erosion followed by Dilation - removes white noise
- **Closing**: Dilation followed by Erosion - fills black holes

### Technical Details:
- **Binary Conversion**: Images are automatically binarized at threshold 127
- **Structuring Elements**:
  - Square: 3x3 all-ones kernel
  - Cross: 3x3 cross-shaped kernel
- **Operations**: 
  - Erosion: All pixels under SE must be 255 → output 255
  - Dilation: Any pixel under SE is 255 → output 255
- Visual SE matrix display
- Performance capped at 500px width

### Structuring Elements:
```
Square:    Cross:
1 1 1      0 1 0
1 1 1      1 1 1
1 1 1      0 1 0
```

---

## Module 4: Segmentation (`segmentation.html` / `segmentation.js`)

**Purpose:** Partitions image into meaningful regions using two different algorithms.

### Features:

#### 4.1 Region Growing
- **Method**: Click on the image to plant a seed point
- **Algorithm**: Breadth-first search (BFS) from seed pixel
- **Distance Metric**: Euclidean distance in RGB color space
- **Tolerance Control**: Slider to adjust color similarity threshold (5-100)
- **Output**: Segmented region highlighted in green

#### 4.2 K-Means Clustering
- **Method**: Button-triggered clustering algorithm
- **Algorithm**: Standard K-Means with random centroid initialization
- **Parameters**:
  - K: Number of clusters (2-10)
  - Iterations: Fixed at 5 for performance
- **Output**: Image colored according to cluster centroids

### Technical Details:
- Performance optimized: max 300px width (computationally heavy)
- 4-way connectivity for region growing
- Euclidean color distance: $\sqrt{(r_1-r_2)^2 + (g_1-g_2)^2 + (b_1-b_2)^2}$
- K-Means converges after 5 iterations (to prevent browser freezing)

---

## UI/UX Features

### Global Navigation
- Top navigation bar links all 4 modules
- Consistent dark header (#1a252f) across all pages
- Responsive layout with flexbox

### Common Controls
- **Image Upload**: Drag-and-drop or file selection
- **Side-by-side Comparison**: Original vs. Processed images
- **Algorithm Selection**: Dropdown menus for operation selection
- **Parameter Controls**: Sliders and buttons for fine-tuning

### Visual Feedback
- Formula/kernel display panels
- Real-time preview updates
- Canvas borders for visual separation
- Crosshair cursor on segmentation page for clickable regions

---

## Technical Stack

### Languages & APIs
- **HTML5**: Semantic structure
- **CSS3**: Grid, Flexbox, responsive design
- **JavaScript (ES6+)**:
  - Canvas 2D API for image manipulation
  - FileReader API for image upload
  - TypedArrays (Uint8Array) for efficient pixel storage

### Performance Optimizations
- Image size capping (300-600px max)
- Efficient 1D array representation for binary/pixel data
- Typed arrays for memory efficiency
- Limited iterations for iterative algorithms

### Browser Compatibility
- Requires Canvas 2D support
- Works on all modern browsers (Chrome, Firefox, Safari, Edge)
- Client-side processing only (no server required)

---

## Key Algorithms Summary

| Module | Algorithm | Type | Input | Output |
|--------|-----------|------|-------|--------|
| 1 | Negation | Point | RGB | RGB |
| 1 | Thresholding | Point | RGB | Binary |
| 1 | Logarithmic | Point | RGB | RGB |
| 1 | Gamma | Point | RGB | RGB |
| 2 | Mean Blur | Spatial | RGB | RGB |
| 2 | Gaussian Blur | Spatial | RGB | RGB |
| 2 | Laplacian | Spatial | RGB | Binary Edges |
| 2 | Sobel | Spatial | RGB | Binary Edges |
| 3 | Erosion | Morphology | Binary | Binary |
| 3 | Dilation | Morphology | Binary | Binary |
| 3 | Opening | Morphology | Binary | Binary |
| 3 | Closing | Morphology | Binary | Binary |
| 4 | Region Growing | Segmentation | RGB | Segmented |
| 4 | K-Means | Segmentation | RGB | Segmented |

---

## Usage Instructions

### General Workflow
1. Open desired HTML file in browser
2. Upload an image using the file input
3. Select algorithm/operation from dropdown
4. Adjust parameters using sliders (if available)
5. View real-time results in the "Processed" canvas

### Module-Specific Tips

**Point Processing**: Adjust threshold/gamma sliders to see immediate effects

**Spatial Filtering**: Try Sobel operators on edges for best results

**Morphology**: Use opening/closing to clean up binary images; binarization is automatic

**Segmentation**: 
- Region Growing: Click on a uniform color area
- K-Means: Increase K for finer segmentation

---

## Limitations & Considerations

1. **Performance**: Large images may cause lag; resize is automatic
2. **Precision**: JavaScript floating-point arithmetic may introduce minor errors
3. **Connectivity**: Region Growing uses 4-way connectivity (not 8-way)
4. **Convergence**: K-Means limited to 5 iterations for responsiveness
5. **Color Space**: All operations in RGB; no HSV or CMYK support

---

## Future Enhancement Opportunities

- [ ] Add 8-way connectivity option for Region Growing
- [ ] Implement K-Means convergence detection
- [ ] Add custom kernel input for Spatial Filtering
- [ ] Support for more structuring element shapes
- [ ] Add image export/download functionality
- [ ] Implement Watershed segmentation
- [ ] Add preprocessing filters (noise reduction)
- [ ] Create histogram visualization
- [ ] Add undo/redo functionality

---

## Files Details

### script.js
- Point processing algorithms
- Slider parameter handling
- Canvas image manipulation

### spatial.js
- Convolution engine
- Kernel definitions
- Edge detection algorithms

### morphology.js
- Binary image conversion
- Erosion/dilation core operations
- Morphological composite operations

### segmentation.js
- Region growing with BFS
- K-Means clustering implementation
- Color distance calculation

### style.css
- Responsive grid layout
- Component styling
- Canvas styling

---

**Project Type**: Computer Vision Educational Tool  
**Created**: Semester 6 - CVA Assignment  
**Status**: Complete with 4 working modules
