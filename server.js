const express = require('express');
const { proxy, scriptUrl } = require('rtsp-relay')(express()); 
const expressWs = require('express-ws');
const app = express();
expressWs(app);

// Định nghĩa danh sách URL RTSP cho các camera
const cameras = {
    // "KD": `rtsp://admin:admin@192.168.110.114:554/`,
    // "SEO": `rtsp://admin:admin@192.168.110.116:554/`,
    // "VH": `rtsp://admin:admin@192.168.110.117:554/`,
    "BAKT": `rtsp://admin:PIFUNR@192.168.1.6:554/`,
    // "PH1": `rtsp://admin:admin@192.168.110.119:554/`,
    "DEV": `rtsp://admin:YIHXCD@192.168.1.4:554/`,
    // "PH2": `rtsp://admin:deadman300$@192.168.110.116:554/stream1`,
};

// Tạo các handler proxy cho mỗi camera
const handlers = {};
Object.keys(cameras).forEach(cameraId => {
    handlers[cameraId] = proxy({
        url: cameras[cameraId],
        verbose: true,
    });
    console.log(`Handler created for camera: ${cameraId}`);
});

// Route để khởi động luồng video cho từng camera dựa vào ID
app.ws('/api/stream/:camera', (ws, req) => {
    const cameraId = req.params.camera;
    console.log(`Received request to stream camera: ${cameraId}`);

    if (handlers[cameraId]) {
        try {
            console.log(`Starting stream for camera: ${cameraId}`);
            handlers[cameraId](ws, req); // Bắt đầu luồng camera
        } catch (error) {
            console.error(`Không thể kết nối tới camera ${cameraId}:`, error);
            ws.close();  // Đóng kết nối nếu có lỗi
        }
    } else {
        console.log(`Camera ${cameraId} không tồn tại.`);
        ws.close();  // Đóng kết nối nếu camera không tồn tại
    }
});

// Cấu hình để render file EJS với danh sách camera
app.set('view engine', 'ejs');
app.use(express.static('public'));

app.get('/', (req, res) => {
    console.log('Rendering index page');
    res.render('index', { scriptUrl, cameras: Object.keys(cameras) });
});

app.listen(8000, () => {
    console.log(`Server is running on port 8000`);
});
