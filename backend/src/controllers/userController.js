const pool = require('../config/db');
const { successResponse, errorResponse } = require('../utils/responseFormatter');
const { isUuid } = require('../utils/validators');
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

async function getUserByEmailOrPhone(identifier, role) {
    const queryText = `SELECT id, email, phone, password_hash, role FROM users WHERE role = $1 AND (email = $2 OR phone = $2)`;
    const result = await pool.query(queryText, [role, identifier]);
    if (result.rowCount === 0) {
        return null;
    }
    return result.rows[0];
}

// Enhanced query function with structural safety guards
async function getPasswordColumn(identifier) {
    try {
        // Double check your table name in Supabase. If your table is "User" or "Doctors", change this!
        // Also ensure your columns are exactly: email, password, role
        const queryText = 'SELECT id, email, phone, COALESCE(password, password_hash) AS password, role FROM users WHERE email = $1 OR phone = $1';
        const result = await pool.query(queryText, [identifier]);

        if (!result || result.rows.length === 0) {
            return null;
        }
        return result.rows[0];
    } catch (dbError) {
        console.error('🔴 DATABASE QUERY EXECUTION CRASHED:', dbError.message);
        throw dbError;
    }
}

// Helper to detect which password column exists for signUp/update flows
async function detectPasswordColumnName() {
    const checkPassword = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'password'");
    if (checkPassword.rowCount > 0) return 'password';
    const checkHash = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'password_hash'");
    if (checkHash.rowCount > 0) return 'password_hash';
    return null;
}

const signUpUser = async (req, res, next) => {
    try {
        const { email, phone, plain_password, role } = req.body;
        if (role !== 'patient' && role !== 'doctor') {
            return errorResponse(res, 400, 'BAD_REQUEST', 'Invalid role');
        }
        if (!email || !phone || !plain_password) {
            return errorResponse(res, 400, 'BAD_REQUEST', 'Missing required fields');
        }
        const hashed_password = await bcrypt.hash(plain_password, 12);
        const checkUser = await pool.query(
            'SELECT id FROM users WHERE email = $1 OR phone = $2',
            [email, phone]
        );

        if (checkUser.rowCount > 0) {
            return errorResponse(res, 409, 'CONFLICT', 'User already exists');
        }

        const passwordColumn = await detectPasswordColumnName();
        if (!passwordColumn) {
            return errorResponse(res, 500, 'INTERNAL_ERROR', 'No supported password column found in users table');
        }

        const result = await pool.query(
            `INSERT INTO users (email, phone, ${passwordColumn}, role) VALUES ($1, $2, $3, $4) RETURNING email, phone, role`,
            [email, phone, hashed_password, role]
        );

        if (result.rowCount === 0) {
            return errorResponse(res, 500, 'INTERNAL_ERROR', 'Failed to create user');
        }

        return successResponse(res, 201, result.rows[0], 'User created successfully');
    } catch (error) {
        if (error.code === '23505') {
            return errorResponse(res, 409, 'CONFLICT', 'Email or phone already registered');
        }
        return next(error);
    }
};

const userLogin = async (req, res) => {
    try {
        const { email, phone, password, plain_password } = req.body;
        const loginPassword = password || plain_password;
        const identifier = email || phone;

        if (!identifier || !loginPassword) {
            return res.status(400).json({ message: 'Email/phone and password are required' });
        }

        console.log(`Processing login for: ${identifier}`);

        const user = await getPasswordColumn(identifier);
        if (!user) {
            console.log(`❌ No account found with identifier: ${identifier}`);
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        let isMatch = false;
        if (user.password && (user.password.startsWith('$2b$') || user.password.startsWith('$2a$'))) {
            isMatch = await bcrypt.compare(loginPassword, user.password);
        } else {
            isMatch = user.password === loginPassword;
        }

        if (!isMatch) {
            console.log(`❌ Password mismatch for user: ${identifier}`);
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const secretKey = process.env.JWT_SECRET || 'carevault_development_secret_key_123';
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role || 'user' },
            secretKey,
            { expiresIn: '24h' }
        );

        console.log(`🟢 LOGIN SUCCESSFUL. Returning token for: ${identifier}`);

        return res.status(200).json({
            status: 'SUCCESS',
            token,
            user: {
                id: user.id,
                email: user.email,
                role: user.role || 'user',
            },
        });
    } catch (error) {
        console.error('🔴 MAIN USER LOGIN CONTROLLER CRASHED:', error.message);
        console.error(error.stack);
        return res.status(500).json({
            status: 'ERROR',
            message: 'An internal server error occurred while processing your request.',
            details: error.message,
        });
    }
};

const getUserById = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!isUuid(id)) {
            return errorResponse(res, 400, 'BAD_REQUEST', 'Invalid user ID format');
        }

        const result = await pool.query(
            'SELECT id, email, phone, role, created_at FROM users WHERE id = $1',
            [id]
        );

        if (result.rowCount === 0) {
            return errorResponse(res, 404, 'NOT_FOUND', 'User not found');
        }

        return successResponse(res, 200, result.rows[0], 'User retrieved successfully');
    } catch (error) {
        return next(error);
    }
};

const getAllUsers = async (req, res, next) => {
    try {
        const { role } = req.query; // Optional filter by role
        let query = 'SELECT id, email, phone, role, created_at FROM users';
        const params = [];

        if (role) {
            if (role !== 'patient' && role !== 'doctor' && role !== 'admin') {
                return errorResponse(res, 400, 'BAD_REQUEST', 'Invalid role');
            }
            query += ' WHERE role = $1';
            params.push(role);
        }

        query += ' ORDER BY created_at DESC';
        const result = await pool.query(query, params);

        return successResponse(res, 200, result.rows, 'Users retrieved successfully');
    } catch (error) {
        return next(error);
    }
};

const updateUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { email, phone, plain_password } = req.body;

        if (!isUuid(id)) {
            return errorResponse(res, 400, 'BAD_REQUEST', 'Invalid user ID format');
        }

        const checkUser = await pool.query('SELECT id FROM users WHERE id = $1', [id]);
        if (checkUser.rowCount === 0) {
            return errorResponse(res, 404, 'NOT_FOUND', 'User not found');
        }

        let updateQuery = 'UPDATE users SET ';
        const params = [];
        let paramCount = 1;

        if (email) {
            updateQuery += `email = $${paramCount}, `;
            params.push(email);
            paramCount++;
        }

        if (phone) {
            updateQuery += `phone = $${paramCount}, `;
            params.push(phone);
            paramCount++;
        }

        if (plain_password) {
            const passwordColumn = await detectPasswordColumnName();
            if (!passwordColumn) {
                return errorResponse(res, 500, 'INTERNAL_ERROR', 'No supported password column found in users table');
            }
            const hashed_password = await bcrypt.hash(plain_password, 12);
            updateQuery += `${passwordColumn} = $${paramCount}, `;
            params.push(hashed_password);
            paramCount++;
        }

        if (params.length === 0) {
            return errorResponse(res, 400, 'BAD_REQUEST', 'No fields to update');
        }

        updateQuery = updateQuery.slice(0, -2);
        updateQuery += ` WHERE id = $${paramCount} RETURNING id, email, phone, role, created_at`;
        params.push(id);

        const result = await pool.query(updateQuery, params);

        return successResponse(res, 200, result.rows[0], 'User updated successfully');
    } catch (error) {
        if (error.code === '23505') {
            return errorResponse(res, 409, 'CONFLICT', 'Email or phone already registered');
        }
        return next(error);
    }
};

const deleteUser = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!isUuid(id)) {
            return errorResponse(res, 400, 'BAD_REQUEST', 'Invalid user ID format');
        }

        const checkUser = await pool.query('SELECT id FROM users WHERE id = $1', [id]);
        if (checkUser.rowCount === 0) {
            return errorResponse(res, 404, 'NOT_FOUND', 'User not found');
        }

        await pool.query('DELETE FROM users WHERE id = $1', [id]);

        return successResponse(res, 200, { id }, 'User deleted successfully');
    } catch (error) {
        return next(error);
    }
};

module.exports = {
    signUpUser: signUpUser,
    userLogin: userLogin,
    getUserById: getUserById,
    getAllUsers: getAllUsers,
    updateUser: updateUser,
    deleteUser: deleteUser
};