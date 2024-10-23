const Router = require('express')
const router = new Router()
const { replaceFile, upload, deleteFile } = require('../multer')

const profileController = require('../controller/profile.controller')

router.get('/info', profileController.info)
router.get('/profile/:id', profileController.getProfile)
router.get('/profiles', profileController.getUsers)
router.patch('/profile/img', upload.single('img'), replaceFile, profileController.changeImgProfile)
router.delete('/profile/img', deleteFile, profileController.deleteImgProfile)

module.exports = router
