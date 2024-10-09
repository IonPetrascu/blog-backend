const Router = require('express')
const router = new Router()

const authController = require('../controller/auth.controller')

router.post('/register', authController.register)
router.post('/login', authController.login)
router.post('/auth/google', authController.authGoogle)


module.exports = router
