const express = require('express');
const authController = require('../controllers/authController');

const router = express.Router();

/**
 * @route   GET /auth/login
 * @desc    Initiate Google OAuth login
 * @access  Public
 * @returns {Object} Authentication URL for Google OAuth
 */
router.get('/login', authController.login);

/**
 * @route   GET /auth/callback
 * @desc    Handle Google OAuth callback
 * @access  Public
 * @param   {string} code - Authorization code from Google
 * @param   {string} state - State parameter for CSRF protection
 * @returns {Object} User information and access tokens
 */
router.get('/callback', authController.callback);

/**
 * @route   GET /auth/status
 * @desc    Check user authentication status
 * @access  Public
 * @param   {string} email - User email address
 * @returns {Object} Authentication status and user info
 */
router.get('/status', authController.status);

/**
 * @route   POST /auth/logout
 * @desc    Logout user (clear tokens)
 * @access  Public
 * @body    {string} email - User email address
 * @returns {Object} Logout confirmation
 */
router.post('/logout', authController.logout);

/**
 * @route   POST /auth/refresh
 * @desc    Refresh user access tokens
 * @access  Public
 * @body    {string} email - User email address
 * @returns {Object} New access tokens
 */
router.post('/refresh', authController.refresh);

module.exports = router;