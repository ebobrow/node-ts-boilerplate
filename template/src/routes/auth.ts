import { Router } from 'express';

import { login, register } from '../controllers/auth';

const router = Router();

router.get('/login', login);
router.get('/register', register);

export default router;
