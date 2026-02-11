const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { isAdmin } = require('../middlewares/authMiddleware');
const PDFDocument = require('pdfkit');

// --- Middleware Removed (moved to authMiddleware.js) ---

// GET all expenses
router.get('/', isAdmin, async (req, res) => {
    try {
        console.log('GET /api/v1/expenses requested by:', req.user.sub);
        const expenses = await Expense.find().sort({ date: -1 });
        console.log(`Found ${expenses.length} expenses`);
        res.json(expenses);
    } catch (e) {
        console.error('GET /api/v1/expenses Error:', e.message);
        res.status(500).json({ detail: e.message });
    }
});

// POST a new expense
router.post('/', isAdmin, async (req, res) => {
    try {
        console.log('POST /api/v1/expenses payload:', req.body);
        const { reason, amount, date, category } = req.body;

        if (!reason || !amount) {
            return res.status(400).json({ detail: 'Reason and Amount are required' });
        }

        const newExpense = new Expense({
            reason,
            amount: Number(amount),
            date: date || undefined,
            category: category || 'General',
            created_by: req.user.id
        });

        await newExpense.save();
        console.log('Expense saved successfully:', newExpense._id);
        res.json({ success: true, message: 'Expense recorded successfully', expense: newExpense });
    } catch (e) {
        console.error('POST /api/v1/expenses Error:', e.message);
        res.status(500).json({ detail: e.message });
    }
});

// PDF Export Route
router.get('/export', isAdmin, async (req, res) => {
    try {
        const { type, month, year } = req.query;
        let query = {};
        let filename = 'Expenses_Report.pdf';
        let periodText = '';

        const y = parseInt(year) || new Date().getFullYear();

        if (type === 'monthly') {
            const m = parseInt(month); // 0-indexed
            const startDate = new Date(y, m, 1);
            const endDate = new Date(y, m + 1, 0, 23, 59, 59);
            query.date = { $gte: startDate, $lte: endDate };
            const monthName = startDate.toLocaleString('default', { month: 'long' });
            filename = `Expenses_${monthName}_${y}.pdf`;
            periodText = `${monthName} ${y}`;
        } else if (type === 'annual') {
            const startDate = new Date(y, 0, 1);
            const endDate = new Date(y, 11, 31, 23, 59, 59);
            query.date = { $gte: startDate, $lte: endDate };
            filename = `Expenses_Annual_${y}.pdf`;
            periodText = `Annual Report ${y}`;
        }

        const expenses = await Expense.find(query).sort({ date: 1 });

        const PDFDocument = require('pdfkit');
        const doc = new PDFDocument({ margin: 50 });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        doc.pipe(res);

        // Header
        doc.fontSize(20).text('SKOSA', { align: 'center' });
        doc.fontSize(14).text('Science Kankara Old Students Association', { align: 'center' });
        doc.moveDown();
        doc.fontSize(16).text('EXPENDITURE REPORT', { align: 'center', underline: true });
        doc.fontSize(12).text(`Period: ${periodText}`, { align: 'center' });
        doc.moveDown();

        // Table Header
        const tableTop = 200;
        const itemCodeX = 50;
        const descriptionX = 120;
        const categoryX = 350;
        const amountX = 450;

        doc.fontSize(10).font('Helvetica-Bold');
        doc.text('Date', itemCodeX, tableTop);
        doc.text('Description', descriptionX, tableTop);
        doc.text('Category', categoryX, tableTop);
        doc.text('Amount (N)', amountX, tableTop, { align: 'right' });

        doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

        // Items
        let yPos = tableTop + 25;
        let total = 0;

        doc.font('Helvetica');
        expenses.forEach(exp => {
            if (yPos > 700) { doc.addPage(); yPos = 50; }

            total += exp.amount;
            const dateStr = new Date(exp.date).toLocaleDateString();

            doc.text(dateStr, itemCodeX, yPos);
            doc.text(exp.reason, descriptionX, yPos, { width: 220 });
            doc.text(exp.category, categoryX, yPos);
            doc.text(exp.amount.toLocaleString(), amountX, yPos, { align: 'right' });

            yPos += 20;
        });

        // Summary
        doc.moveDown();
        doc.moveTo(50, yPos).lineTo(550, yPos).stroke();
        yPos += 10;
        doc.fontSize(12).font('Helvetica-Bold');
        doc.text('GRAND TOTAL:', categoryX, yPos);
        doc.text(`N ${total.toLocaleString()}`, amountX, yPos, { align: 'right' });

        // Footer
        doc.fontSize(10).font('Helvetica-Oblique')
            .text(`Generated on ${new Date().toLocaleString()}`, 50, 750, { align: 'center' });

        doc.end();

    } catch (e) {
        console.error('PDF Export Error:', e);
        res.status(500).json({ detail: 'Failed to generate PDF: ' + e.message });
    }
});

// UPDATE an expense
router.put('/:id', isAdmin, async (req, res) => {
    try {
        const { reason, amount, date, category } = req.body;
        const updatedExpense = await Expense.findByIdAndUpdate(
            req.params.id,
            {
                reason,
                amount: amount ? Number(amount) : undefined,
                date: date || undefined,
                category: category || undefined
            },
            { new: true, runValidators: true }
        );

        if (!updatedExpense) {
            return res.status(404).json({ detail: 'Expense not found' });
        }

        console.log('Expense updated successfully:', updatedExpense._id);
        res.json({ success: true, message: 'Expense updated successfully', expense: updatedExpense });
    } catch (e) {
        console.error('PUT /api/v1/expenses/:id Error:', e.message);
        res.status(500).json({ detail: e.message });
    }
});

// DELETE an expense
router.delete('/:id', isAdmin, async (req, res) => {
    try {
        const deletedExpense = await Expense.findByIdAndDelete(req.params.id);
        if (!deletedExpense) {
            return res.status(404).json({ detail: 'Expense not found' });
        }
        console.log('Expense deleted successfully:', req.params.id);
        res.json({ success: true, message: 'Expense deleted successfully' });
    } catch (e) {
        console.error('DELETE /api/v1/expenses/:id Error:', e.message);
        res.status(500).json({ detail: e.message });
    }
});

module.exports = router;
