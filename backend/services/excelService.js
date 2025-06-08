const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');
const VMModel = require('../models/vmModel');
const WorkModel = require('../models/workModel');

class ExcelService {
    constructor() {
        this.exportsDir = path.join(__dirname, '../../exports');
        this.vmUsageFile = path.join(this.exportsDir, 'vm_usage_data.xlsx');
        this.workTrackingFile = path.join(this.exportsDir, 'work_tracking_data.xlsx');
        this.ensureDirectoryExists();
        
        // Auto-update every 30 seconds
        setInterval(() => {
            this.updateAllExcelFiles();
        }, 30000);
        
        // Initial generation
        this.updateAllExcelFiles();
    }

    ensureDirectoryExists() {
        if (!fs.existsSync(this.exportsDir)) {
            fs.mkdirSync(this.exportsDir, { recursive: true });
        }
    }

    async updateAllExcelFiles() {
        try {
            await Promise.all([
                this.updateVMUsageExcel(),
                this.updateWorkTrackingExcel()
            ]);
            console.log(`[${new Date().toISOString()}] Excel files updated successfully`);
        } catch (error) {
            console.error('Error updating Excel files:', error);
        }
    }

    async updateVMUsageExcel() {
        try {
            const sessions = await VMModel.getAllSessions();
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('VM Usage Data');

            // Add headers with styling
            worksheet.columns = [
                { header: 'Session ID', key: 'id', width: 12 },
                { header: 'VM Name', key: 'vm_name', width: 20 },
                { header: 'Platform', key: 'platform', width: 15 },
                { header: 'User Name', key: 'user_name', width: 20 },
                { header: 'Start Time', key: 'start_time', width: 25 },
                { header: 'End Time', key: 'end_time', width: 25 },
                { header: 'Duration (Minutes)', key: 'duration_minutes', width: 18 },
                { header: 'Purpose', key: 'purpose', width: 40 },
                { header: 'Last Updated', key: 'last_updated', width: 25 }
            ];

            // Style headers
            worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
            worksheet.getRow(1).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: '000000' }
            };

            // Add data with formatting
            sessions.forEach(session => {
                const row = worksheet.addRow({
                    ...session,
                    start_time: session.start_time ? new Date(session.start_time).toLocaleString() : '',
                    end_time: session.end_time ? new Date(session.end_time).toLocaleString() : 'In Progress',
                    last_updated: new Date().toLocaleString()
                });

                // Color code based on status
                if (!session.end_time) {
                    row.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FFF3CD' } // Light yellow for active sessions
                    };
                }
            });

            await workbook.xlsx.writeFile(this.vmUsageFile);
        } catch (error) {
            console.error('Error updating VM usage Excel:', error);
        }
    }

    async updateWorkTrackingExcel() {
        try {
            const sessions = await WorkModel.getAll();
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Work Tracking Data');

            worksheet.columns = [
                { header: 'Session ID', key: 'id', width: 12 },
                { header: 'Employee Name', key: 'employee_name', width: 20 },
                { header: 'Project Name', key: 'project_name', width: 25 },
                { header: 'Activity Type', key: 'activity_type', width: 18 },
                { header: 'Task Description', key: 'task_description', width: 50 },
                { header: 'Start Time', key: 'start_time', width: 25 },
                { header: 'End Time', key: 'end_time', width: 25 },
                { header: 'Duration (Minutes)', key: 'duration_minutes', width: 18 },
                { header: 'Status', key: 'status', width: 15 },
                { header: 'Last Updated', key: 'last_updated', width: 25 }
            ];

            // Style headers
            worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
            worksheet.getRow(1).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: '000000' }
            };

            // Add data
            sessions.forEach(session => {
                const row = worksheet.addRow({
                    ...session,
                    start_time: session.start_time ? new Date(session.start_time).toLocaleString() : '',
                    end_time: session.end_time ? new Date(session.end_time).toLocaleString() : 'In Progress',
                    last_updated: new Date().toLocaleString()
                });

                // Color code based on status
                if (session.status === 'In Progress') {
                    row.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FFF3CD' }
                    };
                } else {
                    row.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'E8F5E8' }
                    };
                }
            });

            await workbook.xlsx.writeFile(this.workTrackingFile);
        } catch (error) {
            console.error('Error updating work tracking Excel:', error);
        }
    }

    // Method to trigger immediate update (called after data changes)
    async triggerUpdate() {
        await this.updateAllExcelFiles();
    }
}

module.exports = ExcelService;
