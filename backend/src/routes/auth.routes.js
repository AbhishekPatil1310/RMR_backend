const fp = require('fastify-plugin');
const authController = require('../controllers/auth.controller');

async function authRoutes(fastify) {
  fastify.post('/auth/register', {
    schema: {
      body: {
        type: 'object',
        required: ['name', 'email', 'password'],
        additionalProperties: false,
        properties: {
          name: { type: 'string' },
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 6 },
          role: { type: 'string', enum: ['user', 'advertiser', 'admin'] },
        },
      },
    },
    handler: authController.register,
  });

  fastify.post('/auth/login', {
    schema: {
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string' },
        },
      },
    },
    handler: authController.login,
  });

  fastify.post('/auth/refresh', authController.refresh);

  fastify.post('/auth/logout', authController.logout);

  fastify.get(
    '/auth/me',
    { preHandler: [fastify.authenticate] },
    authController.getCurrentUser
  );
}

module.exports = fp(authRoutes);
