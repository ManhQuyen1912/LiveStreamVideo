document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('startButton').addEventListener('click', () => {
        const selectedCamera = document.getElementById('cameraSelect').value;
        loadPlayer({
            // url: 'ws://' + location.host + '/api/stream?camera=' + encodeURIComponent(selectedCamera),
            url: 'ws://' + location.host + '/api/stream',
            canvas: document.getElementById('canvas')
        });
        console.log("##################")
        console.log(location.host)
        console.log("##################")
    });
});