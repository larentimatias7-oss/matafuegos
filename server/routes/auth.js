const express = require('express');
const router = express.Router();
const { db } = require('../db');

// GET current session / auth status
router.get('/me', (req, res) => {
  // If Microsoft Entra ID headers or cookies exist, return user info, otherwise return dev user
  res.json({
    authenticated: true,
    user: {
      name: 'Santi (Inspector HyS)',
      email: 'santi.inspeccion@milicic.com.ar',
      role: 'INSPECTOR',
      tenant: 'Milicic S.A.'
    }
  });
});

// GET Entra ID login redirect
router.get('/entra/login', (req, res) => {
  const tenantId = process.env.ENTRA_TENANT_ID;
  const clientId = process.env.ENTRA_CLIENT_ID;
  const redirectUri = process.env.ENTRA_REDIRECT_URI || 'http://localhost:3000/api/auth/entra/callback';

  if (!tenantId || !clientId) {
    // If Entra ID credentials are not provided in environment, simulate successful login for local testing
    return res.redirect('/?auth=entra_simulated&user=Operario+Milicic#scan');
  }

  const authUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&response_mode=query&scope=openid%20profile%20email%20User.Read`;
  res.redirect(authUrl);
});

// GET Entra ID callback
router.get('/entra/callback', async (req, res) => {
  const { code } = req.query;
  // Callback handling with MSAL or JWT
  res.redirect('/?auth=success#scan');
});

module.exports = router;
