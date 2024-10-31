// document.addEventListener('DOMContentLoaded', () => {
//     let wsConnection = null;

//     document.getElementById('startButton').addEventListener('click', () => {
//         const selectedCamera = document.getElementById('cameraSelect').value;
//         const canvas = document.getElementById('canvas');
//         // Close existing WebSocket connection if it exists
//         if (wsConnection && wsConnection.readyState === WebSocket.OPEN) {
//             wsConnection.close();
//         }

//         // Try to connect to the new WebSocket
//         const wsUrl = 'ws://' + location.host + '/api/stream/' + encodeURIComponent(selectedCamera);
//         wsConnection = new WebSocket(wsUrl);

//         wsConnection.onopen = () => {
//             loadPlayer({
//                 url: wsUrl,
//                 canvas: canvas
//             });
//         };

//         wsConnection.onerror = () => {
//             // Display error message or clear canvas
//             console.error("Cannot connect to the camera.");
//             if (canvas && canvas.getContext) {
//                 canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
//             }
//             wsConnection.close();
//         };

//         wsConnection.onclose = () => {
//             console.log("WebSocket connection closed.");
//             if (canvas && canvas.getContext) {
//                 canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
//             }
//         };
//     });
// });
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('canvas');
    const wsConnections = {};

    // Khởi tạo kết nối WebSocket cho tất cả các camera
    const cameraSelect = document.getElementById('cameraSelect');
    const cameraOptions = Array.from(cameraSelect.options).map(option => option.value);

    cameraOptions.forEach(cameraId => {
        const wsUrl = 'ws://' + location.host + '/api/stream/' + encodeURIComponent(cameraId);
        const wsConnection = new WebSocket(wsUrl);

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
        const selectedCamera = document.getElementById('cameraSelect').value;
        const wsConnection = wsConnections[selectedCamera];

        if (wsConnection && wsConnection.readyState === WebSocket.OPEN) {
            loadPlayer({
                url: wsConnection.url,
                canvas: canvas
            });
        } else {
            console.error(`WebSocket connection for camera ${selectedCamera} is not open.`);
        }
    });
});
