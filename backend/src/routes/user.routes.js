const userController = require('../controllers/user.controller')
const fp = require('fastify-plugin');

async function userRoutes(fastify) {
    fastify.post('/upload-ad', {
        preHandler: [fastify.authenticate],
        handler: userController.uploadAdHandler,
    });
    fastify.get('/profile', {
        preHandler: [fastify.authenticate],
        handler: userController.getUserProfile,
    });
    fastify.get('/category/:type', {
        preHandler: [fastify.authenticate],
        handler: userController.getAds,
    });
    fastify.post('/cart/:adId', {
        preHandler: [fastify.authenticate],
        handler: userController.AddToCart,
    });
    fastify.get('/cart', {
        preHandler: [fastify.authenticate],
        handler: userController.getCartHandler,
    });

    fastify.get('/ad/:id', {
        preHandler: [fastify.authenticate],
        handler: userController.getAdById,
    });
    fastify.post('/remove-from-cart', {
        preHandler: [fastify.authenticate],
        handler: userController.removeFromCartHandler,
    });
    fastify.post('/related-ads', {
        preHandler: [fastify.authenticate],
        handler: userController.getRelatedAds,
    });
    fastify.post('/Address', {
        preHandler: [fastify.authenticate],
        handler: userController.addAddress,
    });
    fastify.put('/Address/:addressId', {
        preHandler: [fastify.authenticate],
        handler: userController.updateAddress,
    });
    fastify.put('/ads/:adId', {
        preHandler: [fastify.authenticate],
        handler: userController.updateAd,
    });
    fastify.delete('/Address/:addressId', {
        preHandler: [fastify.authenticate],
        handler: userController.deleteAddress,
    });
    fastify.delete('/ads/:adId', {
        preHandler: [fastify.authenticate],
        handler: userController.deleteAds,
    });
    fastify.get('/GetAddress', {
        preHandler: [fastify.authenticate],
        handler: userController.getUserAddresses,
    });
    fastify.get('/GetMyAds', {
        preHandler: [fastify.authenticate],
        handler: userController.getAdvertiserAdsHandler,
    });
    fastify.post('/orders', {
        preHandler: [fastify.authenticate],
        handler: userController.createOrder,
    });


}


module.exports = fp(userRoutes); 
