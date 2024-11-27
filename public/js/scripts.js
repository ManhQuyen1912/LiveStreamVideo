document.addEventListener('DOMContentLoaded', () => {
    const wsConnections = {};
    const captureInterval = 5000;
    let modelPromise = cocoSsd.load().then(model => {
        console.log('Model loaded successfully');
        return model;
    }).catch(error => {
        console.error('Error loading model:', error);
    });

    const cameraOptions = Array.from(document.querySelectorAll('.grid-item canvas')).map(canvas => canvas.id.split('-')[1]);
    cameraOptions.forEach(cameraId => {
        const wsUrl = 'ws://' + location.host + '/api/stream/' + encodeURIComponent(cameraId);
        const wsConnection = new WebSocket(wsUrl);

        wsConnection.onmessage = (event) => {
            console.log(`Data received from camera ${cameraId}`);
        };

        wsConnection.onopen = () => {
            console.log(`WebSocket connection opened for camera ${cameraId}`);
        };

        wsConnection.onerror = () => {
            console.error(`Cannot connect to camera ${cameraId}.`);
        };

        wsConnection.onclose = () => {
            console.log(`WebSocket connection closed for camera ${cameraId}.`);
        };

        wsConnections[cameraId] = wsConnection;
    });

    document.getElementById('startButton').addEventListener('click', () => {
        cameraOptions.forEach(cameraId => {
            const wsConnection = wsConnections[cameraId];
            const canvas = document.getElementById(`canvas-${cameraId}`);

            if (wsConnection && wsConnection.readyState === WebSocket.OPEN) {
                loadPlayer({
                    url: wsConnection.url,
                    canvas: canvas
                });
                setInterval(() => {
                    // captureAndDetect(canvas, cameraId);
                }, captureInterval);
            } else {
                console.error(`WebSocket connection for camera ${cameraId} is not open.`);
            }
        });
    });

    

    /*
    document.getElementById('startButton').addEventListener('click', () => {
        cameraOptions.forEach(cameraId => {
            const wsConnection = wsConnections[cameraId];
            const canvas = document.getElementById(`canvas-${cameraId}`);
    
            if (wsConnection && wsConnection.readyState === WebSocket.OPEN) {
                let frameCount = 0;
                console.log(wsConnection.url)
                loadPlayer({
                    url: wsConnection.url,
                    canvas: canvas,
                    onFrame: (frame) => {
                        frameCount++;
                        if (frameCount % 30 === 0) { // Every 30 frames
                            console.log('Frame received:', frameCount);
                        }
                    },
                    // onSourceEstablished: () => {
                    //     // Wait a short time for first frame
                    //     setTimeout(() => {
                    //         const hasContent = debugCanvasContent(canvas);
                    //         console.log('Stream established, canvas has content:', hasContent);
                    //     }, 1000);
                    // }
                });
            } else {
                console.error(`WebSocket connection for camera ${cameraId} is not open.`);
            }
        });
    });
    */
    
    /*
    document.getElementById('captureButton').addEventListener('click', () => {
        const canvas = document.getElementById(`canvas-DEV`);
        if (!canvas) {
            console.error('Canvas not found');
            return;
        }
    
        // Get the context
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            console.error('Could not get canvas context');
            return;
        }
    
        // Make sure canvas has proper dimensions
        if (canvas.width === 0 || canvas.height === 0) {
            console.error('Canvas has zero dimensions');
            return;
        }
    
        try {
            // Force a new frame render if needed
            ctx.drawImage(canvas, 0, 0);
            
            // Capture the current frame
            const imageData = canvas.toDataURL('image/jpeg', 1.0);
            
            // Debug: Check if image data is valid
            console.log('Image data length:', imageData.length);
            console.log('Canvas dimensions:', canvas.width, 'x', canvas.height);
            
            // Create a test image to verify data
            const testImage = new Image();
            testImage.onload = () => {
                console.log('Successfully loaded captured image');
                showImageInModal(imageData);
            };
            testImage.onerror = () => {
                console.error('Failed to load captured image');
            };
            testImage.src = imageData;
            
        } catch (error) {
            console.error('Error during capture:', error);
        }
    });
    
    // Modified showImageInModal function
    function showImageInModal(imageData) {
        const modal = document.getElementById('imageModal');
        const modalImg = document.getElementById('modalImage');
        
        if (!modal || !modalImg) {
            console.error('Modal elements not found');
            return;
        }
        
        modalImg.onload = () => {
            console.log('Image loaded in modal successfully');
            modal.style.display = 'block';
        };
        
        modalImg.onerror = (e) => {
            console.error('Error loading image in modal:', e);
        };
        
        modalImg.src = imageData;
    }
    
    // Helper function to verify canvas content
    function debugCanvasContent(canvas) {
        const ctx = canvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // Check if canvas has any non-black pixels
        const hasContent = data.some((value, index) => {
            // Every 4th value is alpha channel
            return index % 4 !== 3 && value !== 0;
        });
        
        console.log('Canvas content check:', {
            hasContent,
            width: canvas.width,
            height: canvas.height,
            dataLength: data.length,
            samplePixels: data.slice(0, 20)
        });
        
        return hasContent;
    }

    document.getElementById('modalClose').addEventListener('click', () => {
        document.getElementById('imageModal').style.display = 'none';
    });

    async function captureAndDetect(canvas, cameraId) {
        const model = await modelPromise;
        if (!model) {
            console.error('Model not loaded');
            return;
        }
        const resizedCanvas = resizeCanvas(canvas, 640, 480);
        const imageData = resizedCanvas.toDataURL('image/jpeg', 0.5).replace('data:image/jpeg;base64,', '');
        const img = new Image();
        img.src = `data:image/jpeg;base64,${imageData}`;

        img.onload = async () => {
            const predictions = await model.detect(img);
            console.log(`Predictions for camera ${cameraId}:`, predictions);
            const personDetected = predictions.some(prediction => prediction.class === 'person');

            if (personDetected) {
                captureImageAndSend(canvas, cameraId);
            }
        };
    }

    function resizeCanvas(canvas, maxWidth, maxHeight) {
        const width = canvas.width;
        const height = canvas.height;
        if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            const newWidth = width * ratio;
            const newHeight = height * ratio;
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = newWidth;
            tempCanvas.height = newHeight;
            const ctx = tempCanvas.getContext('2d');
            ctx.drawImage(canvas, 0, 0, newWidth, newHeight);
            return tempCanvas;
        }
        return canvas;
    }

    function captureImageAndSend(canvas, cameraId) {
        const imageData = canvas.toDataURL('image/jpeg').replace('data:image/jpeg;base64,', '');

        fetch('/api/send-image', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                cameraId: cameraId,
                image_base64: imageData
            })
        })
        .then(response => response.json())
        .then(data => {
            console.log(`Image from camera ${cameraId} sent successfully.`, data);
        })
        .catch(error => {
            console.error(`Failed to send image from camera ${cameraId}.`, error);
        });
    }
    */
});