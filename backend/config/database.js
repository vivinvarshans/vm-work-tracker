const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Create database connection
const dbPath = path.join(__dirname, '../../tracker.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to SQLite database');
    }
});

// Function to initialize database tables
function initializeDatabase() {
    db.serialize(() => {
        // Create VMs table
        db.run(`
            CREATE TABLE IF NOT EXISTS vms (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                platform TEXT NOT NULL,
                status TEXT DEFAULT 'Available',
                current_user TEXT,
                start_time DATETIME,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `, (err) => {
            if (err) {
                console.error('Error creating vms table:', err.message);
            } else {
                console.log('VMs table created/verified');
            }
        });

        // Create VM Sessions table
        db.run(`
            CREATE TABLE IF NOT EXISTS vm_sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                vm_id INTEGER,
                user_name TEXT NOT NULL,
                start_time DATETIME NOT NULL,
                end_time DATETIME,
                duration_minutes INTEGER,
                purpose TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (vm_id) REFERENCES vms(id)
            )
        `, (err) => {
            if (err) {
                console.error('Error creating vm_sessions table:', err.message);
            } else {
                console.log('VM Sessions table created/verified');
            }
        });

        // Create Work Sessions table
        db.run(`
            CREATE TABLE IF NOT EXISTS work_sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                employee_name TEXT NOT NULL,
                project_name TEXT,
                task_description TEXT,
                start_time DATETIME NOT NULL,
                end_time DATETIME,
                duration_minutes INTEGER,
                activity_type TEXT,
                status TEXT DEFAULT 'In Progress',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `, (err) => {
            if (err) {
                console.error('Error creating work_sessions table:', err.message);
            } else {
                console.log('Work Sessions table created/verified');
            }
        });

        // Insert sample VMs if table is empty
        db.get("SELECT COUNT(*) as count FROM vms", (err, row) => {
            if (!err && row.count === 0) {
                const sampleVMs = [
                    ['Azure-Dev-01', 'Azure'],
                    ['AWS-Prod-01', 'AWS'],
                    ['GCP-Test-01', 'GCP']
                ];

                sampleVMs.forEach(([name, platform]) => {
                    db.run("INSERT INTO vms (name, platform) VALUES (?, ?)", [name, platform]);
                });
                console.log('Sample VMs inserted');
            }
        });
    });
}

module.exports = { db, initializeDatabase };
