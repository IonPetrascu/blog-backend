const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { generateUniqueFileName } = require('./utils/index')

/* const fileTypes = {
  image: ['.jpg', '.jpeg', '.png', '.gif'],
  video: ['.mp4', '.mkv', '.avi'],
  audio: ['.mp3', '.wav'],
};

const getFileFolder = (ext) => {
  if (fileTypes.image.includes(ext)) return 'uploads/images';
  if (fileTypes.video.includes(ext)) return 'uploads/videos';
  if (fileTypes.audio.includes(ext)) return 'uploads/audio';
  return null;
}; */


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

const deleteFile = (req, res, next) => {
  const { img, video } = req.body;
  if (img) {
    const imgType = '.' + img.split('.').pop();
    let imgFolder = '';

    if (['.jpg', '.jpeg', '.png', '.gif'].includes(imgType)) {
      imgFolder = 'uploads/images';
    }

    const imgPath = path.join(__dirname, imgFolder, img);

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

    fs.unlink(videoPath, (err) => {
      if (err) {
        console.error('Error deleting video:', err);
      }
    });
  }

  next()

};

const replaceFile = async (req, res, next) => {
  const { imgName, videoName, deleteImage, deleteVideo } = req.body;
  const promises = [];

  if (imgName && imgName !== 'null' && deleteImage === 'true') {
    const oldImgPath = path.join(__dirname, 'uploads/images', imgName);
    promises.push(new Promise((resolve, reject) => {
      fs.unlink(oldImgPath, (err) => {
        if (err) {
          console.error('Error deleting old image:', err);
          return reject(err);
        }
        resolve();
      });
    }));
  }

  if (videoName && videoName !== 'null' && deleteVideo === 'true') {
    const oldVideoPath = path.join(__dirname, 'uploads/videos', videoName);
    promises.push(new Promise((resolve, reject) => {
      fs.unlink(oldVideoPath, (err) => {
        if (err) {
          console.error('Error deleting old video:', err);
          return reject(err);
        }
        resolve();
      });
    }));
  }

  try {
    await Promise.all(promises);
    next();
  } catch (err) {
    res.status(500).json({ message: 'Error deleting files' });
  }
};



module.exports = {
  upload,
  deleteFile,
  replaceFile,
};
