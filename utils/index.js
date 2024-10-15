const { v4: uuidv4 } = require('uuid');
const path = require('path')

const generateUniqueFileName = (originalName) => {
  const ext = path.extname(originalName);
  const uniqueId = uuidv4();
  const timestamp = Date.now();
  return `${timestamp}-${uniqueId}${ext}`;
};

module.exports = {
  generateUniqueFileName
};
