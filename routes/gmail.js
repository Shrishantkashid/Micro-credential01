const express = require('express');
const gmailController = require('../controllers/gmailController');

const router = express.Router();

/**
 * @route   POST /gmail/sync
 * @desc    Scan Gmail for certificates and store them
 * @access  Private (requires authentication)
 * @body    {string} email - User email address
 * @returns {Object} Sync results with new certificates found
 */
router.post('/sync', gmailController.sync);

/**
 * @route   GET /gmail/certificates
 * @desc    Get all certificates for a user
 * @access  Private
 * @param   {string} email - User email address
 * @returns {Object} List of user's certificates
 */
router.get('/certificates', gmailController.getCertificates);

/**
 * @route   GET /gmail/test
 * @desc    Test Gmail API connection
 * @access  Private
 * @param   {string} email - User email address
 * @returns {Object} Connection test results
 */
router.get('/test', gmailController.testConnection);

/**
 * @route   GET /gmail/stats
 * @desc    Get certificate statistics for a user
 * @access  Private
 * @param   {string} email - User email address
 * @returns {Object} Statistics about user's certificates
 */
router.get('/stats', gmailController.getStats);

module.exports = router;