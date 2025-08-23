import User from "../models/userModel.js";

class UserController {
    async getUsers(req, res) {
        try {
            const users = await User.getAll();
            res.json(users);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    async getUser(req, res) {
        try {
            const user = await User.getById(req.params.id);
            if (!user) return res.status(404).json({ message: 'User not found' });
            res.json(user);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    async createUser(req, res) {
        try {
            const { name, email } = req.body;
            const newUser = await User.create({ name, email });
            res.status(201).json(newUser);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    async updateUser(req, res) {
        try {
            const { name, email } = req.body;
            const updatedUser = await User.update(req.params.id, { name, email });
            res.json(updatedUser);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    async deleteUser(req, res) {
        try {
            await User.delete(req.params.id);
            res.json({ message: 'User deleted' });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
}

export default new UserController();