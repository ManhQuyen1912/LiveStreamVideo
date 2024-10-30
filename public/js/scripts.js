document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('startButton').addEventListener('click', () => {
        const selectedCamera = document.getElementById('cameraSelect').value;
        loadPlayer({
            url: 'ws://' + location.host + '/api/stream/' + encodeURIComponent(selectedCamera),
            canvas: document.getElementById('canvas')
        });
    });
});
