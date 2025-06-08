const { db } = require('../config/database');

class VMModel {
    // Get all VMs
    static getAll() {
        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM vms ORDER BY platform, name`;
            db.all(sql, [], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    // Create new VM
    static create(name, platform) {
        return new Promise((resolve, reject) => {
            const sql = `INSERT INTO vms (name, platform) VALUES (?, ?)`;
            db.run(sql, [name, platform], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ id: this.lastID, message: 'VM created successfully' });
                }
            });
        });
    }

    // Start VM session
    static startSession(vmId, userName, purpose) {
        return new Promise((resolve, reject) => {
            const startTime = new Date().toISOString();
            
            // Update VM status
            const updateVMSql = `
                UPDATE vms 
                SET status = 'In Use', current_user = ?, start_time = ? 
                WHERE id = ?
            `;
            
            db.run(updateVMSql, [userName, startTime, vmId], function(err) {
                if (err) {
                    reject(err);
                    return;
                }
                
                // Create session record
                const createSessionSql = `
                    INSERT INTO vm_sessions (vm_id, user_name, start_time, purpose) 
                    VALUES (?, ?, ?, ?)
                `;
                
                db.run(createSessionSql, [vmId, userName, startTime, purpose], function(err) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve({ sessionId: this.lastID, message: 'Session started' });
                    }
                });
            });
        });
    }

    // Stop VM session
    static stopSession(vmId) {
        return new Promise((resolve, reject) => {
            const endTime = new Date().toISOString();
            
            // Find active session
            const findSessionSql = `
                SELECT * FROM vm_sessions 
                WHERE vm_id = ? AND end_time IS NULL 
                ORDER BY start_time DESC LIMIT 1
            `;
            
            db.get(findSessionSql, [vmId], (err, session) => {
                if (err || !session) {
                    reject(new Error('No active session found'));
                    return;
                }
                
                // Calculate duration
                const duration = Math.round(
                    (new Date(endTime) - new Date(session.start_time)) / (1000 * 60)
                );
                
                // Update session
                const updateSessionSql = `
                    UPDATE vm_sessions 
                    SET end_time = ?, duration_minutes = ? 
                    WHERE id = ?
                `;
                
                db.run(updateSessionSql, [endTime, duration, session.id], function(err) {
                    if (err) {
                        reject(err);
                        return;
                    }
                    
                    // Update VM status
                    const updateVMSql = `
                        UPDATE vms 
                        SET status = 'Available', current_user = NULL, start_time = NULL 
                        WHERE id = ?
                    `;
                    
                    db.run(updateVMSql, [vmId], function(err) {
                        if (err) {
                            reject(err);
                        } else {
                            resolve({ duration, message: 'Session stopped' });
                        }
                    });
                });
            });
        });
    }

    // Get all VM sessions
    static getAllSessions() {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT vs.*, v.name as vm_name, v.platform 
                FROM vm_sessions vs 
                JOIN vms v ON vs.vm_id = v.id 
                ORDER BY vs.start_time DESC
            `;
            db.all(sql, [], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }
}

module.exports = VMModel;
