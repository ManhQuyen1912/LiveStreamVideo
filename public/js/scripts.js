document.addEventListener('DOMContentLoaded', () => {
    const wsConnections = {};
    const captureInterval = 5000;

    // Khởi tạo kết nối WebSocket cho tất cả các camera
    const cameraOptions = Array.from(document.querySelectorAll('.grid-item canvas')).map(canvas => canvas.id.split('-')[1]);

    cameraOptions.forEach(cameraId => {
        const wsUrl = 'ws://' + location.host + '/api/stream/' + encodeURIComponent(cameraId);
        const wsConnection = new WebSocket(wsUrl);

        wsConnection.onmessage = (event) => {
            console.log(`Data received from camera ${cameraId}`);
            // Optional: Draw a sample frame to canvas to verify data processing
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
                    captureImageAndSend(canvas,cameraId);
                },captureInterval);
            } else {
                console.error(`WebSocket connection for camera ${cameraId} is not open.`);
            }
        });
    });
    function captureImageAndSend(canvas, cameraId) {
        const imageData = canvas.toDataURL('image/jpeg').replace('data:image/png;base64,', '');
    
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
});