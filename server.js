const express = require('express');
const app = express();
const { proxy, scriptUrl } = require('rtsp-relay')(app); // Automatically enables WebSocket

// Endpoint cho mỗi camera dựa trên ID hoặc tên camera
app.ws('/api/stream/:camera', (ws, req) => {
  const camera = req.params.camera;
  
  // Cấu hình URL RTSP cho từng camera cụ thể
  const handler = proxy({
    url: `rtsp://admin:YIHXCD@192.168.110.${camera}:554`, // Giả sử camera được cấu hình bằng IP
    verbose: false,
  });

  // Khởi chạy handler để chuyển luồng RTSP đến WebSocket
  handler(ws, req);
});

// Set the view engine to EJS
app.set('view engine', 'ejs');

// Serve static files from the 'public' directory
app.use(express.static('public'));

// Serve the HTML file using EJS
app.get('/', (req, res) => {
  res.render('index', { scriptUrl });
});

app.listen(8000, () => {
  console.log(`Server is running on port 8000`);
});
