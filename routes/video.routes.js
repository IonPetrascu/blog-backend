const Router = require('express')
const router = new Router()

const videoController = require('../controller/video.controller')

router.get('/video/:filename', videoController.streamVideo)

module.exports = router
