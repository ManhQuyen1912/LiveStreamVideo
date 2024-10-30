const express = require('express');
const app = express();
const { proxy, scriptUrl } = require('rtsp-relay')(app); // Automatically enables WebSocket

// Configure RTSP relay handler
const handler = proxy({
  url: `rtsp://admin:YIHXCD@192.168.110.115:554`,
  verbose: false,
});
app.ws('/api/stream', handler);

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

const ffmpeg = require('fluent-ffmpeg');

ffmpeg('rtsp://admin:YIHXCD@192.168.110.115:554')
  .outputOptions('-f segment', '-segment_time 3', '-reset_timestamps 1')
  .output('output%d.mp4')
  .on('end', () => {
    console.log('Stream capture finished');
  })
  .run();