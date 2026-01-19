import express from 'express';
import * as authController from '../controllers/auth.js';
import { validateSignUp, validateSignIn, validateEmail } from '../middleware/validation.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.post('/signup', validateSignUp, authController.signUp);
router.post('/signin', validateSignIn, authController.signIn);
router.post('/signin/google', authController.signInWithGoogle);
router.post('/signout', authController.signOut);
router.post('/refresh', authController.refreshToken);
router.post('/check-email', validateEmail, authController.checkEmailProvider);
router.post('/profile', authenticateToken, authController.createOrUpdateProfile);

export default router;