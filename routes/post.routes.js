const Router = require('express')
const router = new Router()
const { upload, deleteFile } = require('../multer')


const postController = require('../controller/post.controller')

router.get('/posts', postController.getPosts)
router.get('/posts/:id', postController.getOnePost)
router.post('/posts', upload.fields([
  { name: 'file', maxCount: 1 },
  { name: 'video', maxCount: 1 }
]), postController.addPost)
router.delete('/posts/:id', deleteFile, postController.deletePost)


module.exports = router
