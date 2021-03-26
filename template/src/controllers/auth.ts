import { Request, Response } from 'express';

export const login = (req: Request, res: Response) => {
	res.send('Logged in');
};

export const register = (req: Request, res: Response) => {
	res.send('Account registered');
};
