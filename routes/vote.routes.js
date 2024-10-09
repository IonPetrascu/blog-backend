const Router = require('express')
const router = new Router()

const voteController = require('../controller/vote.controller')

router.post('/votes', voteController.addVote)
router.delete('/votes', voteController.deleteVote)


module.exports = router
