const { db } = require('../config/database');

class WorkModel {
    // Get all work sessions
    static getAll() {
        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM work_sessions ORDER BY start_time DESC`;
            db.all(sql, [], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    // Start work session
    static startSession(employeeName, projectName, taskDescription, activityType) {
        return new Promise((resolve, reject) => {
            const startTime = new Date().toISOString();
            const sql = `
                INSERT INTO work_sessions 
                (employee_name, project_name, task_description, activity_type, start_time) 
                VALUES (?, ?, ?, ?, ?)
            `;
            
            db.run(sql, [employeeName, projectName, taskDescription, activityType, startTime], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ sessionId: this.lastID, message: 'Work session started' });
                }
            });
        });
    }

    // Stop work session
    static stopSession(sessionId) {
        return new Promise((resolve, reject) => {
            const endTime = new Date().toISOString();
            
            // Get session details
            db.get("SELECT * FROM work_sessions WHERE id = ?", [sessionId], (err, session) => {
                if (err || !session) {
                    reject(new Error('Session not found'));
                    return;
                }

                const duration = Math.round(
                    (new Date(endTime) - new Date(session.start_time)) / (1000 * 60)
                );

                const sql = `
                    UPDATE work_sessions 
                    SET end_time = ?, duration_minutes = ?, status = 'Completed' 
                    WHERE id = ?
                `;
                
                db.run(sql, [endTime, duration, sessionId], function(err) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve({ duration, message: 'Work session completed' });
                    }
                });
            });
        });
    }

    // Get active session for user
    static getActiveSession(employeeName) {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT * FROM work_sessions 
                WHERE employee_name = ? AND status = 'In Progress' 
                ORDER BY start_time DESC LIMIT 1
            `;
            db.get(sql, [employeeName], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }
}

module.exports = WorkModel;
