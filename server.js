require('dotenv').config;
const express = require('express');
const { proxy, scriptUrl } = require('rtsp-relay')(express()); 
const expressWs = require('express-ws');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');
const cron = require('node-cron');
const { error } = require('console');
const app = express();
expressWs(app);

const cameras = {
    "KD": `rtsp://admin:DIRWZQ@192.168.129.145:554/`,
    // "SEO": `rtsp://admin:admin@192.168.110.116:554/`,
    "VH": `rtsp://admin:YQPEFE@192.168.129.124:554/`,
    "BAKT": `rtsp://admin:PIFUNR@192.168.1.14:5542/`,
    // "PH1": `rtsp://admin:HVVBKO@192.168.1.3:5545`,
    "DEV": `rtsp://admin:YIHXCD@192.168.1.14:5547/`,
    // "PH2": `rtsp://admin:deadman300$@192.168.110.116:554/stream1`,
};
const cutVideoCounters = {};

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

const fetchWithTimeout = async (url, options, timeout = 5000) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    try {
        const response = await fetch(url, { ...options, signal: controller.signal });
        clearTimeout(id);
        return response;
    } catch (error) {
        console.error('Fetch request timed out or failed:', error);
        throw error;
    }
};

const captureImage = (cameraId) => {
    const outputFilePath = path.join(__dirname, `${cameraId}_snapshot.jpg`);

    ffmpeg(cameras[cameraId])
        .frames(1) // Capture a single frame
        .output(outputFilePath)
        .on('end', async () => {
            console.log(`Captured image for camera ${cameraId}`);

            // Convert the image to base64
            const imageBuffer = fs.readFileSync(outputFilePath);
            const imageBase64 = imageBuffer.toString('base64');

            // Send image to API endpoint
            try {
                await fetchWithTimeout("http://ecom.draerp.vn/api/method/hrms.hr.doctype.employee_checkin.employee_checkin.checkin_face", {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Basic ${Buffer.from(process.env.API_USERNAME + ":" + process.env.API_PASSWORD).toString('base64')}`
                    },
                    body: JSON.stringify({
                        cameraId,
                        image_base64: imageBase64
                    })
                });
                console.log(`Image sent to API for camera ${cameraId}`);
            } catch (error) {
                console.error(`Error sending image for camera ${cameraId}:`, error);
            }

            // Clean up
            if (fs.existsSync(outputFilePath)) {
                fs.unlinkSync(outputFilePath);
            } else {
                console.warn(`File not found for deletion: ${outputFilePath}`);
            }
        })
        .on('error', (err) => {
            console.error(`Capture error for camera ${cameraId}:`, err);
        })
        .run();
};

// Schedule the capture every few seconds (adjust as needed)
// Object.keys(cameras).forEach(cameraId => {
//     cron.schedule('*/10 * * * * *', () => { // Captures every 10 seconds
//         console.log(`Capturing image for camera ${cameraId}`);
//         captureImage(cameraId);
//     });
// });

function startRecording(cameraId, duration = 3600) {
    // console.log(`Starting recording with:`, { cameraId, duration });
    const startDate = new Date();
    const dateString = startDate.toISOString().split('T')[0]; // Get YYYY-MM-DD format
    const hourString = startDate.getHours().toString().padStart(2, '0'); // Get HH format
    console.log(`Hour: ${hourString}`);
    let fileName;
    if (duration !== 3600){
        if (!cutVideoCounters[cameraId]){
            cutVideoCounters[cameraId] = 1;
        } else {
            cutVideoCounters[cameraId]++;
        }
        fileName = `Cut_Video_${cutVideoCounters[cameraId]}.mp4`;
    } else {
        fileName = `${hourString}.mp4`;
    }
    const outputPath = path.join(baseRecordingPath, cameraId, dateString,fileName);
    // console.log(`Output path: ${outputPath}`);
    if (!fs.existsSync(path.dirname(outputPath))) {
        fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    }

    const ffmpegProcess = ffmpeg(cameras[cameraId])
        .output(outputPath)
        .outputOptions([
            '-c copy',
            `-t ${duration}`,
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
            ws.on('open', () => {
                console.log('Kết nối WebSocket đã được thiết lập');
            });
            
            ws.on('message', (data) => {
                console.log('Kết nối thành công');
            });
            
            ws.on('error', (error) => {
                console.error('Lỗi xảy ra trong kết nối WebSocket:', error);
            });
            
            ws.on('close', () => {
                console.log('Kết nối WebSocket đã bị đóng');
            });
        } catch (error) {
            console.error(`Không thể kết nối tới camera ${cameraId}:`, error);
            ws.close();  // Đóng kết nối nếu có lỗi
        }
    } else {
        console.log(`Camera ${cameraId} không tồn tại.`);
        ws.close();  // Đóng kết nối nếu camera không tồn tại
    }
});

app.use(express.json())
app.post('/api/send-image', async (req, res) => {
    const { cameraId, image_base64 } = req.body;
    
    try {
        const response = await fetch("http://ecom.draerp.vn/api/method/hrms.hr.doctype.employee_checkin.employee_checkin.checkin_face", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${Buffer.from(process.env.API_USERNAME + ":" + process.env.API_PASSWORD).toString('base64')}`
            },
            body: JSON.stringify({
                cameraId,
                image_base64
            })
        });
        
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Error sending image:', error);
        res.status(500).json({ error: 'Failed to send image' });
    }
});

// Cấu hình để render file EJS với danh sách camera
app.set('view engine', 'ejs');
app.use(express.static('public'));

app.get('/', (req, res) => {
    console.log('Rendering index page');
    res.render('index', { scriptUrl, cameras: Object.keys(cameras) });
});

//view recording
app.use('/new_recordings', express.static(path.join(__dirname, 'new_recordings')));
app.get('/api/recordings',(req,res)=>{
    const recordingsDir = path.join(__dirname,'new_recordings');
    const getDirectoryStructure = (dirPath) => {
        const result = {};
        const items = fs.readdirSync(dirPath);
        items.forEach(item=>{
            const itemPath = path.join(dirPath,item);
            const stats = fs.statSync(itemPath);
            if (stats.isDirectory()){
                result[item] = getDirectoryStructure(itemPath);
            } else if (item.endsWith('.mp4')){
                if (!result.files) result.files =[];
                result.files.push(item);
            }
        });
        return result;
    };
    try {
        const directoryStructure = getDirectoryStructure(recordingsDir);
        res.json(directoryStructure);
    } catch (error) {
        console.error('Error reading directory structure:', error);
        res.status(500).json({ error: 'Failed to retrieve recordings' });
    }
})

app.get('/recordings', (req,res) => {
    res.render('recordings');
})

app.post('/api/start-recording',(req,res)=>{
    const {cameraId, duration} = req.body;
    console.log(cameraId, duration);
    if (!cameraId || !duration) {
        return res.status(400).send({message: 'Missing parameters'});
    }
    try {
        // startRecording(cameraId,duration);
        captureImage(cameraId);
        res.send({message: `Recording started for camera ${cameraId}`});
    } catch (err){
        console.log(err);
        res.status(500).send({message:'Failed to start recording', error: err.message})
    }
})

app.listen(8000, () => {
    console.log(`Server is running on port 8000`);
});

