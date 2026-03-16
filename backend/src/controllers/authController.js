import { registerUser, loginUser } from "../services/authService.js";

export async function register(req, res, next) {
  try {
    const { name, email, password, role, managerId } = req.body;
    const { user, token } = await registerUser({
      name,
      email,
      password,
      role,
      managerId
    });

    res.status(201).json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const { user, token } = await loginUser({ email, password });

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      }
    });
  } catch (err) {
    next(err);
  }
}

