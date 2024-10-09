const Router = require('express')
const router = new Router()

const postController = require('../controller/post.controller')

router.get('/posts', postController.getPosts)
router.get('/posts/:id', postController.getOnePost)
router.post('/posts', postController.addPost)
router.delete('/posts/:id', postController.deletePost)


module.exports = router
