document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('startButton').addEventListener('click', () => {
        const selectedCamera = document.getElementById('cameraSelect').value;

        if (selectedCamera) {
            loadPlayer({
                url: 'ws://' + location.host + '/api/stream/' + selectedCamera,
                canvas: document.getElementById('canvas')
            });
        } else {
            alert("Vui lòng chọn camera trước khi bắt đầu.");
        }
    });
});
