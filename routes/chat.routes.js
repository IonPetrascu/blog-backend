const Router = require('express')
const router = new Router()

const chatController = require('../controller/chat.controller')

router.get('/chats', chatController.getChats)
router.post('/chats', chatController.addChat)
router.delete('/chats/:id', chatController.deleteChat)


module.exports = router
