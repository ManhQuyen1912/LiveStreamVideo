const express = require('express');
const app = express();

const { proxy, scriptUrl } = require('rtsp-relay')(app);

const handler = proxy({
  url: `rtsp://admin:YIHXCD@192.168.110.120:554/`,
  verbose: false,
});

app.ws('/api/stream', handler);

app.get('/', (req, res) =>
  res.send(`
  <div id="video-container">
    <canvas id="canvas"></canvas>
  </div>

  <script src='${scriptUrl}'></script>
  <script>
    loadPlayer({
      url: 'ws://' + location.host + '/api/stream',
      canvas: document.getElementById('canvas')
    });
  </script>

  <style>
    #video-container {
      position: relative;
      width: 100%;
      height: 0;
      padding-bottom: 56.25%; /* 16:9 aspect ratio */
    }

    #canvas {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
    }
  </style>
`),
);

app.listen(2000, () => {
  console.log('Server is running on port 2000');
});



// const express = require('express');
// const path = require('path');
// const app = express();
// const { proxy, scriptUrl } = require('rtsp-relay')(app); // Automatically enables WebSocket

// // Configure RTSP relay handler
// const handler = proxy({
//   url: `rtsp://admin:YIHXCD@192.168.110.120:554/`,
//   verbose: false,
//   additionalFlags: ['-rtsp_transport', 'tcp'],
// });

// // Serve static files from the "public" directory
// app.use(express.static(path.join(__dirname, 'public')));

// // Set up WebSocket route to stream the RTSP feed
// app.ws('/api/stream', handler);

// // Define the main route to serve the HTML file
// app.get('/', (req, res) => {
//   res.sendFile(path.join(__dirname, 'public', 'index.html'));
// });

// const PORT = process.env.PORT || 2000;
// app.listen(PORT, () => {
//   console.log(`Server is running on port ${PORT}`);
// });
