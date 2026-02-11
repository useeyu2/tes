const express = require('express');
const router = express.Router();

// Public
router.get('/', (req, res) => res.redirect('/login'));
router.get('/login', (req, res) => res.render('auth/login'));
router.get('/register', (req, res) => res.render('auth/register'));
router.get('/forgot-password', (req, res) => res.render('auth/forgot_password'));
router.get('/reset-password/:token?', (req, res) => res.render('auth/reset_password', { token: req.params.token || '' }));

// Member
router.get('/dashboard', (req, res) => res.render('member/dashboard'));
router.get('/contributions', (req, res) => res.render('member/contributions'));
router.get('/welfare', (req, res) => res.render('member/welfare'));
router.get('/donations', (req, res) => res.render('member/donations'));
router.get('/history', (req, res) => res.render('member/history'));
router.get('/messages', (req, res) => res.render('member/messages'));
router.get('/directory', (req, res) => res.render('member/directory'));
router.get('/settings', (req, res) => res.render('member/settings'));
router.get('/events', (req, res) => res.render('member/events'));
router.get('/gallery', (req, res) => res.render('member/gallery'));
router.get('/voting', (req, res) => res.render('member/voting'));
router.get('/results', (req, res) => res.render('common/results'));
router.get('/auth/signup-superadmin', (req, res) => res.render('auth/signup_superadmin'));

// Admin Routes
router.get('/admin/dashboard', (req, res) => res.render('admin/dashboard'));
// Reusing members list as dashboard
router.get('/admin/payments', (req, res) => res.render('admin/payments'));
router.get('/admin/expenses', (req, res) => res.render('admin/expenses'));
router.get('/admin/welfare', (req, res) => res.render('admin/welfare'));
router.get('/admin/messages', (req, res) => res.render('admin/messages'));
router.get('/admin/events/create', (req, res) => res.render('admin/create_event'));
router.get('/admin/gallery/upload', (req, res) => res.render('admin/upload_photo'));
router.get('/admin/voting/setup', (req, res) => res.render('admin/voting_setup'));

module.exports = router;
