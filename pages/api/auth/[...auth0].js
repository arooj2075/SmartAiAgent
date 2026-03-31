import { handleAuth, handleLogin } from '@auth0/nextjs-auth0';

export default handleAuth({
  async login(req, res) {
    try {
      await handleLogin(req, res, {
        authorizationParams: {
          audience: 'https://smart-ai-agent/',
          scope: 'openid profile email offline_access',
          connection: process.env.AUTH0_CONNECTION || 'google-oauth2',
        },
      });
    } catch (error) {
      res.status(error.status || 500).end(error.message);
    }
  },
});
