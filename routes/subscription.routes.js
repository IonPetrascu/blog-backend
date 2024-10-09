const Router = require('express')
const router = new Router()

const subscriptionController = require('../controller/subscription.controller')

router.post('/subscriptions/:id', subscriptionController.addSubscription)
router.delete('/subscriptions/:id', subscriptionController.deleteSubscription)


module.exports = router
