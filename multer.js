const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { generateUniqueFileName } = require('./utils/index')

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase().trim()

    if (['.jpg', '.jpeg', '.png', '.gif'].includes(ext)) {
      cb(null, 'uploads/images');
    } else if (['.mp4', '.mkv', '.avi'].includes(ext)) {
      cb(null, 'uploads/videos');
    } else if (['.mp3', '.wav'].includes(ext)) {
      cb(null, 'uploads/audio');
    } else {
      return cb(new Error('Unsupported file type'), false);
    }
  },
  filename: function (req, file, cb) {
    const uniqueName = generateUniqueFileName(file.originalname);

    const ext = path.extname(file.originalname).toLowerCase().trim();

    if (['.jpg', '.jpeg', '.png', '.gif'].includes(ext)) {
      req.imageName = uniqueName;
    } else if (['.mp4', '.mkv', '.avi'].includes(ext)) {
      req.videoName = uniqueName;
    }

    cb(null, uniqueName);
  }
})

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024

  }
}
)

const uploadFile = (req, res) => {
  res.json(req.file);
};

const deleteFile = (req, res, next) => {
  const { img, video } = req.body;
  if (img) {
    const imgType = '.' + img.split('.').pop();
    let imgFolder = '';

    if (['.jpg', '.jpeg', '.png', '.gif'].includes(imgType)) {
      imgFolder = 'uploads/images';
    }

    const imgPath = path.join(__dirname, imgFolder, img);
    console.log(imgPath);

    fs.unlink(imgPath, (err) => {
      if (err) {
        console.error('Error deleting image:', err);
      }
    });
  }

  if (video) {
    const videoType = '.' + video.split('.').pop();
    let videoFolder = '';

    if (['.mp4', '.mkv', '.avi'].includes(videoType)) {
      videoFolder = 'uploads/videos';
    }

    const videoPath = path.join(__dirname, videoFolder, video);

    console.log(videoPath);
    fs.unlink(videoPath, (err) => {
      if (err) {
        console.error('Error deleting video:', err);
      }
    });
  }

  next()

};

const replaceFile = (req, res, next) => {
  const { name } = req.body
  const { file } = req

  if (!file) {
    return res.status(400).json({ message: 'No new file uploaded' });
  }

  const ext = path.extname(file.originalname).toLowerCase();
  let folder = '';

  if (['.jpg', '.jpeg', '.png', '.gif'].includes(ext)) {
    folder = 'uploads/images';
  } else if (['.mp4', '.mkv', '.avi'].includes(ext)) {
    folder = 'uploads/videos';
  } else if (['.mp3', '.wav'].includes(ext)) {
    folder = 'uploads/audio';
  } else {


    return res.status(400).json({ message: 'Unsupported file type', ext });
  }

  if (name) {

    const oldFilePath = path.join(__dirname, folder, name);
    fs.unlink(oldFilePath, (err) => {
      return next()

    });
  } else {
    next();
  }

};


module.exports = {
  upload,
  uploadFile,
  deleteFile,
  replaceFile,
};
