const User = require('../models/user.model');
const Ad = require('../models/ad.model'); 

async function submitFeedbackHandler(req, reply) {
    console.log('hit the feedback controller');
  try {
    const { adId } = req.params;
    const { comment, rating } = req.body;



    const feedback = {
      userId: req.userData._id,
      userName: req.userData.name,     
      userEmail: req.userData.email,    
      comment,
      rating,
      createdAt: new Date(),     
    };

    const ad = await Ad.findByIdAndUpdate(
      adId,
      { $push: { feedbacks: feedback } },
      { new: true }
    );

    if (!ad) return reply.notFound('Ad not found.');

    reply.send({ success: true, message: 'Feedback submitted', ad });
  } catch (err) {
    req.log.error({ err }, '[submitFeedbackHandler] Failed to submit feedback');
    reply.internalServerError('Failed to submit feedback');
  }
}

module.exports = {submitFeedbackHandler}