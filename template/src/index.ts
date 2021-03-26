import express from 'express';

import homeRoutes from './routes';
import authRoutes from './routes/auth';

const app = express();

app.use('/', homeRoutes);
app.use('/auth', authRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
	console.log(`App listening on port ${PORT}`);
});
