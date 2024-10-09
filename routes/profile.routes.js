const Router = require('express')
const router = new Router()

const profileController = require('../controller/profile.controller')

router.get('/info', profileController.info)
router.get('/profile/:id', profileController.getProfile)
router.patch('/profile/img', profileController.changeImgProfile)

module.exports = router
