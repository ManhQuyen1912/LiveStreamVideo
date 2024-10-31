document.addEventListener('DOMContentLoaded', () => {
    let wsConnection = null;

    document.getElementById('startButton').addEventListener('click', () => {
        const selectedCamera = document.getElementById('cameraSelect').value;
        const canvas = document.getElementById('canvas');
        // Close existing WebSocket connection if it exists
        if (wsConnection && wsConnection.readyState === WebSocket.OPEN) {
            wsConnection.close();
        }

        // Try to connect to the new WebSocket
        const wsUrl = 'ws://' + location.host + '/api/stream/' + encodeURIComponent(selectedCamera);
        wsConnection = new WebSocket(wsUrl);

        wsConnection.onopen = () => {
            loadPlayer({
                url: wsUrl,
                canvas: canvas
            });
        };

        wsConnection.onerror = () => {
            // Display error message or clear canvas
            console.error("Cannot connect to the camera.");
            if (canvas && canvas.getContext) {
                canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
            }
            wsConnection.close();
        };

        wsConnection.onclose = () => {
            console.log("WebSocket connection closed.");
            if (canvas && canvas.getContext) {
                canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
            }
        };
    });
});
