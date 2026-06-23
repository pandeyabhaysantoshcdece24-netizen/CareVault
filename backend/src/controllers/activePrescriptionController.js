const pool = require('../config/db');
const { successResponse, errorResponse } = require('../utils/responseFormatter');
const { isUuid } = require('../utils/validators');


const getActiveMedicationByUserId = async (req, res, next) => {
    try {
        const { userId } = req.params;
        const requesterId = req.user?.id;
        const requesterRole = req.user?.role;

        if (!userId) {
            return errorResponse(res, 400, 'BAD_REQUEST', 'UserId not provided');
        }

        if (!isUuid(userId)) {
            return errorResponse(res, 400, 'BAD_REQUEST', 'Invalid user ID format');
        }

        if (!requesterId || requesterRole !== 'patient' || requesterId !== userId) {
            return errorResponse(res, 403, 'FORBIDDEN', 'You can only view your own active medications');
        }

        const patientProfile = await pool.query(
            'SELECT id FROM patients WHERE user_id = $1',
            [userId]
        );

        if (patientProfile.rowCount === 0) {
            return errorResponse(res, 404, 'NOT_FOUND', 'Patient profile not found');
        }

        const patientId = patientProfile.rows[0].id;

        const result = await pool.query(
            `SELECT
               m.id,
               m.name,
               m.dosage,
               m.prescibed_for,
               m.prescibed_at,
               m.prescribed_by,
               m.patient_id,
               COALESCE(m.doctor_name, d.full_name) AS doctor_name
             FROM active_medication m
             LEFT JOIN doctors d ON d.id = m.prescribed_by
             WHERE m.patient_id = $1
             ORDER BY m.prescibed_at DESC, m.name ASC`,
            [patientId]
        );

        if (result.rowCount === 0) {
            return successResponse(res, 200, [], 'No active medications found');
        }

        return successResponse(res, 200, result.rows, 'Medications fetched successfully');
    } catch (error) {
        return next(error);
    }
};

const getPatientActiveMedicationForDoctor = async (req, res, next) => {
    try {
        const { patientId } = req.params;
        const doctorId = req.doctor?.id;

        if (!patientId) {
            return errorResponse(res, 400, 'BAD_REQUEST', 'patientId not provided');
        }

        if (!isUuid(patientId)) {
            return errorResponse(res, 400, 'VALIDATION_ERROR', 'patientId must be a valid UUID');
        }

        if (!doctorId) {
            return errorResponse(res, 403, 'FORBIDDEN', 'Doctor verification context missing');
        }

        const access = await pool.query(
            `select id from access_permissions
             where patient_id = $1 and doctor_id = $2
               and status = 'active'
               and (expires_at is null or expires_at > now())`,
            [patientId, doctorId]
        );

        if (access.rowCount === 0) {
            const activeConsultation = await pool.query(
                `select id from consultations
                 where patient_id = $1 and doctor_id = $2 and status = 'in_progress'
                 limit 1`,
                [patientId, doctorId]
            );

            if (activeConsultation.rowCount === 0) {
                return errorResponse(res, 403, 'FORBIDDEN', 'No active access permission for this patient');
            }
        }

        const result = await pool.query(
            `SELECT
               m.id,
               m.name,
               m.dosage,
               m.prescibed_for,
               m.prescibed_at,
               m.prescribed_by,
               m.patient_id,
               COALESCE(m.doctor_name, d.full_name) AS doctor_name
             FROM active_medication m
             LEFT JOIN doctors d ON d.id = m.prescribed_by
             WHERE m.patient_id = $1
             ORDER BY m.prescibed_at DESC, m.name ASC`,
            [patientId]
        );

        return successResponse(res, 200, result.rows, 'Operation successful.');
    } catch (error) {
        return next(error);
    }
};

const deleteActiveMedicationById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const doctorId = req.doctor?.id;

        if (!id) {
            return errorResponse(res, 400, 'BAD_REQUEST', 'Medication ID not provided');
        }

        if (!isUuid(id)) {
            return errorResponse(res, 400, 'BAD_REQUEST', 'Invalid medication ID format');
        }

        if (!doctorId) {
            return errorResponse(res, 403, 'FORBIDDEN', 'Doctor verification context missing');
        }

        const checkMed = await pool.query(
            'SELECT id FROM active_medication WHERE id = $1',
            [id]
        );

        if (checkMed.rowCount === 0) {
            return errorResponse(res, 404, 'NOT_FOUND', 'Medication not found');
        }

        const result = await pool.query(
            'DELETE FROM active_medication WHERE id = $1 RETURNING id, name, patient_id, doctor_name',
            [id]
        );

        return successResponse(res, 200, result.rows[0], 'Medication deleted successfully');
    } catch (error) {
        return next(error);
    }
};

const addActiveMedication = async (req, res, next) => {
    try {
        const { patient_id, name, dosage, prescibed_for, prescibed_at } = req.body;
        const doctorId = req.doctor?.id;

        // Validation
        if (!patient_id || !name || !dosage || !prescibed_for || !prescibed_at) {
            return errorResponse(res, 400, 'BAD_REQUEST', 'Missing required fields: patient_id, name, dosage, prescibed_for, prescibed_at');
        }

        if (!isUuid(patient_id)) {
            return errorResponse(res, 400, 'BAD_REQUEST', 'Invalid patient ID format');
        }

        if (!doctorId) {
            return errorResponse(res, 403, 'FORBIDDEN', 'Doctor verification context missing');
        }

        const patientProfile = await pool.query(
            'SELECT id FROM patients WHERE id = $1',
            [patient_id]
        );

        if (patientProfile.rowCount === 0) {
            return errorResponse(res, 404, 'NOT_FOUND', 'Patient not found');
        }

        const result = await pool.query(
            `INSERT INTO active_medication (name, dosage, prescibed_for, prescibed_at, prescribed_by, patient_id, doctor_name)
             VALUES ($1, $2, $3, $4, $5, $6, (SELECT full_name FROM doctors WHERE id = $5))
             RETURNING id, name, dosage, prescibed_for, prescibed_at, prescribed_by, patient_id, doctor_name`,
            [name, dosage, prescibed_for, prescibed_at, doctorId, patient_id]
        );

        return successResponse(res, 201, result.rows[0], 'Medication added successfully');
    } catch (error) {
        return next(error);
    }
};

const updateActiveMedication = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, dosage, prescibed_for, prescibed_at } = req.body;
        const doctorId = req.doctor?.id;

        if (!id) {
            return errorResponse(res, 400, 'BAD_REQUEST', 'Medication ID not provided');
        }

        if (!isUuid(id)) {
            return errorResponse(res, 400, 'BAD_REQUEST', 'Invalid medication ID format');
        }

        if (!doctorId) {
            return errorResponse(res, 403, 'FORBIDDEN', 'Doctor verification context missing');
        }

        if (!name && !dosage && !prescibed_for && !prescibed_at) {
            return errorResponse(res, 400, 'BAD_REQUEST', 'At least one field must be provided for update');
        }
        const checkMed = await pool.query(
            'SELECT id FROM active_medication WHERE id = $1',
            [id]
        );

        if (checkMed.rowCount === 0) {
            return errorResponse(res, 404, 'NOT_FOUND', 'Medication not found');
        }

        let updateQuery = 'UPDATE active_medication SET ';
        const params = [];
        let paramCount = 1;

        if (name) {
            updateQuery += `name = $${paramCount}, `;
            params.push(name);
            paramCount++;
        }

        if (dosage) {
            updateQuery += `dosage = $${paramCount}, `;
            params.push(dosage);
            paramCount++;
        }

        if (prescibed_for) {
            updateQuery += `prescibed_for = $${paramCount}, `;
            params.push(prescibed_for);
            paramCount++;
        }

        if (prescibed_at) {
            updateQuery += `prescibed_at = $${paramCount}, `;
            params.push(prescibed_at);
            paramCount++;
        }

        updateQuery += `prescribed_by = $${paramCount}, doctor_name = (SELECT full_name FROM doctors WHERE id = $${paramCount}) WHERE id = $${paramCount + 1} RETURNING id, name, dosage, prescibed_for, prescibed_at, prescribed_by, patient_id, doctor_name`;
        params.push(doctorId, id);

        const result = await pool.query(updateQuery, params);

        return successResponse(res, 200, result.rows[0], 'Medication updated successfully');
    } catch (error) {
        return next(error);
    }
};

module.exports = {
    getActiveMedicationByUserId,
    getPatientActiveMedicationForDoctor,
    deleteActiveMedicationById,
    addActiveMedication,
    updateActiveMedication
};