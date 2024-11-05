const express = require('express');
const { proxy, scriptUrl } = require('rtsp-relay')(express()); 
const expressWs = require('express-ws');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');
const cron = require('node-cron');
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

const recordingProcesses = {};
const baseRecordingPath = path.join(__dirname, 'new_recordings');

function startRecording(cameraId) {
    const date = new Date();
    const dateString = date.toISOString().split('T')[0]; // Get YYYY-MM-DD format
    const hourString = date.getHours().toString().padStart(2, '0'); // Get HH format
    const outputPath = path.join(baseRecordingPath, cameraId, dateString, `${hourString}.mp4`);

    if (!fs.existsSync(path.dirname(outputPath))) {
        fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    }

    const ffmpegProcess = ffmpeg(cameras[cameraId])
        .output(outputPath)
        .outputOptions([
            '-c copy',
            '-t 3600',
            '-movflags +faststart'
        ])
        .on('start', () => {
            console.log(`Recording started for camera ${cameraId}`);
        })
        .on('end', () => {
            console.log(`Recording ended for camera ${cameraId}`);
        })
        .on('error', (err) => {
            console.error(`Recording error for camera ${cameraId}:`, err);
        })
        .run();

    recordingProcesses[cameraId] = ffmpegProcess;
}

function stopRecording(cameraId) {
    const ffmpegProcess = recordingProcesses[cameraId];

    if (ffmpegProcess) {
        ffmpegProcess.kill('SIGINT');
        delete recordingProcesses[cameraId];
        console.log(`Recording stopped for camera ${cameraId}`);
    } else {
        console.log(`No recording process found for camera ${cameraId}`);
    }
}

Object.keys(cameras).forEach(cameraId => {
    cron.schedule('0 * * * *', () => {
        console.log(`Starting scheduled recording for camera ${cameraId}`);
        startRecording(cameraId);
    });
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
