const Router = require('express')
const router = new Router()

const commentController = require('../controller/comment.controller.js')

router.get('/posts/:id/comments', commentController.getPostComments)
router.post('/comments', commentController.addComment)


module.exports = router
