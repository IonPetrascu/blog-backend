
const fs = require('fs')
const path = require('path')

class VideoController {
  async streamVideo(req, res) {
    const { filename } = req.params; //get name file
    const videoPath = path.join(__dirname, '../uploads/videos', filename); //create path to file
    console.log(videoPath);


    fs.stat(videoPath, (err, stats) => {
      if (err || !stats) {
        return res.status(404).send('Video not found')
      }

      const fileSize = stats.size
      const range = req.headers.range// get range
      res.setHeader('Cache-Control', 'no-store');

      if (range) {//if client get some range

        const parts = range.replace(/bytes=/, "").split("-");// [bytes,bytes ]
        const start = parseInt(parts[0], 10); // to number (ten formal)
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1; // if end bytes exist set ,if not set last bytes of file

        const chunkSize = (end - start) + 1; // set chunk size

        const file = fs.createReadStream(videoPath, { start, end });
        //We create a stream for reading a video file with a given beginning and end(only part of the file is sent)

        const head = {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`, // set range
          'Accept-Ranges': 'bytes', //We inform you that the server supports requests in parts(byte ranges)
          'Content-Length': chunkSize, // chunk size sended
          'Content-Type': 'video/mp4', // type format
        };

        res.writeHead(206, head); // 206 (Partial Content)

        file.pipe(res); // send part of video
      } else { // get full file if not exist range
        const head = {
          'Content-Length': fileSize, // file size
          'Content-Type': 'video/mp4', // type video mp4
        };
        res.writeHead(200, head);// send 200 ok ,send full file
        fs.createReadStream(videoPath).pipe(res); // create a stream to read the entire file and send it to the client

      }
    }
    )


  }



}

module.exports = new VideoController()
