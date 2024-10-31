document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('startButton').addEventListener('click', () => {
        const selectedCamera = document.getElementById('cameraSelect').value;
        const canvas = document.getElementById('canvas');
        const context = canvas.getContext('2d');
        
        // Clear the canvas immediately when a new camera is selected
        context.clearRect(0, 0, canvas.width, canvas.height);

        const wsUrl = 'ws://' + location.host + '/api/stream/' + encodeURIComponent(selectedCamera);
        const wsConnection = new WebSocket(wsUrl);

        wsConnection.onopen = () => {
            loadPlayer({
                url: wsUrl,
                canvas: canvas
            });
        };

        wsConnection.onerror = () => {
            console.error("Không thể kết nối tới camera.");
            wsConnection.close();  // Đóng kết nối ngay khi gặp lỗi
        };

        wsConnection.onclose = () => {
            // Đảm bảo canvas trống nếu không có kết nối
            context.clearRect(0, 0, canvas.width, canvas.height);
            console.log("Kết nối WebSocket đã đóng.");
        };
    });
});