const feedbackController = require('../controllers/feedback.controller');
const fp = require('fastify-plugin');

async function feedBackRoute(fastify) {
  fastify.post('/feedback/:adId', {   // ✅ Removed :adId from URL
    preHandler: [fastify.authenticate],
    handler: feedbackController.submitFeedbackHandler,
  });
}

module.exports = fp(feedBackRoute);
