import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { signToken } from '../utils/token.js';

function sendAuthResponse(res, statusCode, user) {
  res.status(statusCode).json({
    success: true,
    token: signToken(user._id),
    user,
  });
}

export async function register(req, res) {
  const { name, email, phone, password } = req.body;

  if (await User.exists({ email })) {
    throw new AppError('An account with this email already exists', 409);
  }

  const user = await User.create({ name, email, phone, password });
  sendAuthResponse(res, 201, user);
}

export async function login(req, res) {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  // Same message for unknown email and wrong password, so accounts can't be enumerated.
  if (!user || !(await user.comparePassword(password))) {
    throw new AppError('Incorrect email or password', 401);
  }

  sendAuthResponse(res, 200, user);
}

export function getMe(req, res) {
  res.json({ success: true, user: req.user });
}
