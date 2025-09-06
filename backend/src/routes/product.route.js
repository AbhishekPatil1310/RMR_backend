const { model } = require('mongoose');
const searchController = require('../controllers/search.controller')
const fp = require('fastify-plugin');


async function searchRoute(fastify) {
  fastify.get('/products/search', {   // ✅ Removed :adId from URL
    preHandler: [fastify.authenticate],
    handler: searchController.searchProducts,
  });
}

module.exports = fp(searchRoute)