const Ad = require('../models/ad.model');

async function searchProducts(req, reply) {
  try {
    const { keyword } = req.query; 

    let query = {};
    if (keyword && keyword.trim() !== '') {
      const regex = { $regex: keyword.trim(), $options: 'i' };
      query = {
        $or: [
          { productName: regex },
          { adType: regex },
        ],
      };
    }

    const ads = await Ad.find(query);
    reply.send(ads);
  } catch (err) {
    console.error(err);
    reply.code(500).send({ success: false, message: 'Server error' });
  }
}

module.exports = { searchProducts };
