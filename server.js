
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import cors from 'cors';
import { body, param, query, validationResult } from 'express-validator';
import db from './src/db.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use(express.static(path.join(__dirname, 'public')));

const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// List + search students
app.get('/api/students', [
  query('q').optional().isString().trim().escape()
], handleValidation, (req, res) => {
  const { q } = req.query;
  try {
    let rows;
    if (q && q.length > 0) {
      const like = `%${q}%`;
      rows = db.prepare(`
        SELECT id, name, surname, email, phone, id_number, course, address, created_at, updated_at
        FROM students
        WHERE name LIKE ? OR surname LIKE ? OR email LIKE ? OR id_number LIKE ?
        ORDER BY created_at DESC
      `).all(like, like, like, like);
    } else {
      rows = db.prepare(`
        SELECT id, name, surname, email, phone, id_number, course, address, created_at, updated_at
        FROM students
        ORDER BY created_at DESC
      `).all();
    }
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

// Get single student
app.get('/api/students/:id', [
  param('id').isInt()
], handleValidation, (req, res) => {
  try {
    const row = db.prepare('SELECT * FROM students WHERE id = ?').get(req.params.id);
    if (!row) return res.status(404).json({ error: 'Student not found' });
    res.json(row);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to fetch student' });
  }
});

// Create student
app.post('/api/students', [
  body('name').trim().notEmpty().withMessage('Name is required').isAlpha('en-US', {ignore: ' -''}).withMessage('Name must contain letters only'),
  body('surname').trim().notEmpty().withMessage('Surname is required').isAlpha('en-US', {ignore: ' -''}).withMessage('Surname must contain letters only'),
  body('email').trim().notEmpty().isEmail().withMessage('Valid email required').normalizeEmail(),
  body('phone').trim().notEmpty().matches(/^\d{10}$/).withMessage('Phone must be 10 digits'),
  body('id_number').trim().notEmpty().matches(/^\d{13}$/).withMessage('ID number must be 13 digits'),
  body('course').trim().notEmpty().withMessage('Course is required'),
  body('address').optional().isLength({ max: 200 }).withMessage('Address too long')
], handleValidation, (req, res) => {
  const { name, surname, email, phone, id_number, course, address } = req.body;
  try {
    // enforce uniqueness on email and id_number
    const exists = db.prepare('SELECT 1 FROM students WHERE email = ? OR id_number = ?').get(email, id_number);
    if (exists) {
      return res.status(409).json({ error: 'Email or ID number already exists' });
    }
    const stmt = db.prepare(`
      INSERT INTO students (name, surname, email, phone, id_number, course, address)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(name, surname, email, phone, id_number, course, address || '');
    const created = db.prepare('SELECT * FROM students WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json(created);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to create student' });
  }
});

// Update student
app.put('/api/students/:id', [
  param('id').isInt(),
  body('name').trim().notEmpty().isAlpha('en-US', {ignore: ' -''}),
  body('surname').trim().notEmpty().isAlpha('en-US', {ignore: ' -''}),
  body('email').trim().notEmpty().isEmail().normalizeEmail(),
  body('phone').trim().notEmpty().matches(/^\d{10}$/),
  body('id_number').trim().notEmpty().matches(/^\d{13}$/),
  body('course').trim().notEmpty(),
  body('address').optional().isLength({ max: 200 })
], handleValidation, (req, res) => {
  const { name, surname, email, phone, id_number, course, address } = req.body;
  const id = Number(req.params.id);
  try {
    // check for uniqueness conflicts on other rows
    const conflict = db.prepare('SELECT id FROM students WHERE (email = ? OR id_number = ?) AND id != ?').get(email, id_number, id);
    if (conflict) {
      return res.status(409).json({ error: 'Email or ID number already used by another student' });
    }
    const stmt = db.prepare(`
      UPDATE students
      SET name=?, surname=?, email=?, phone=?, id_number=?, course=?, address=?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    const info = stmt.run(name, surname, email, phone, id_number, course, address || '', id);
    if (info.changes === 0) return res.status(404).json({ error: 'Student not found' });
    const updated = db.prepare('SELECT * FROM students WHERE id = ?').get(id);
    res.json(updated);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to update student' });
  }
});

// Delete student (optional)
app.delete('/api/students/:id', [
  param('id').isInt()
], handleValidation, (req, res) => {
  try {
    const info = db.prepare('DELETE FROM students WHERE id = ?').run(req.params.id);
    if (info.changes === 0) return res.status(404).json({ error: 'Student not found' });
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to delete student' });
  }
});

// Fallback to index.html for root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
