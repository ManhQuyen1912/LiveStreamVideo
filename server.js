const express = require('express');
const { proxy, scriptUrl } = require('rtsp-relay')(express()); 
const expressWs = require('express-ws');
const app = express();
expressWs(app);

// Định nghĩa danh sách URL RTSP cho các camera
const cameras = {
    "MKT": `rtsp://admin:YIHXCD@192.168.110.114:554/`,
    "SEO": `rtsp://admin:YIHXCD@192.168.110.116:554/`,
    "VH": `rtsp://admin:YIHXCD@192.168.110.117:554/`,
    "DEV": `rtsp://admin:YIHXCD@192.168.110.115:554/`,
    // Thêm các camera khác vào đây
};

// Tạo các handler proxy cho mỗi camera
const handlers = {};
Object.keys(cameras).forEach(cameraId => {
    handlers[cameraId] = proxy({
        url: cameras[cameraId],
        verbose: false,
    });
});

// Route để khởi động luồng video cho từng camera dựa vào ID
app.ws('/api/stream/:camera', (ws, req) => {
    const cameraId = req.params.camera;
    if (handlers[cameraId]) {
        handlers[cameraId](ws, req);  // Khởi động luồng cho camera tương ứng
    } else {
        ws.close();  // Đóng kết nối nếu camera không tồn tại
    }
});

// Cấu hình để render file EJS với danh sách camera
app.set('view engine', 'ejs');
app.use(express.static('public'));

app.get('/', (req, res) => {
    res.render('index', { scriptUrl, cameras: Object.keys(cameras) });
});

app.listen(8000, () => {
    console.log(`Server is running on port 8000`);
});
