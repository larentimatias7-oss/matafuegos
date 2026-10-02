const express = require('express');
const router = express.Router();
const { db } = require('../db');

// GET all cases with days open calculation
router.get('/', (req, res) => {
  try {
    const { status } = req.query;
    let query = `
      SELECT c.*, e.location, e.type, e.capacity, e.floor, e.area,
        CAST((julianday('now', 'localtime') - julianday(c.opened_at)) AS INTEGER) as days_open
      FROM cases c
      LEFT JOIN extinguishers e ON c.extinguisher_id = e.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      query += ' AND c.status = ?';
      params.push(status);
    }

    query += ' ORDER BY c.status ASC, c.opened_at DESC';

    const cases = db.prepare(query).all(...params);
    res.json({ success: true, count: cases.length, cases });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT update case status / replacement
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { status, resolution_notes, assigned_to, temp_replacement_code, priority } = req.body;

    const isClosing = status === 'RESUELTO';
    const closedAtValue = isClosing ? "datetime('now', 'localtime')" : "NULL";

    const update = db.prepare(`
      UPDATE cases SET
        status = COALESCE(?, status),
        resolution_notes = COALESCE(?, resolution_notes),
        assigned_to = COALESCE(?, assigned_to),
        temp_replacement_code = COALESCE(?, temp_replacement_code),
        priority = COALESCE(?, priority),
        closed_at = ${isClosing ? "datetime('now', 'localtime')" : "closed_at"}
      WHERE id = ?
    `);

    update.run(status, resolution_notes, assigned_to, temp_replacement_code, priority, id);

    // If replacement was registered, update extinguisher notes
    if (temp_replacement_code) {
      const caseRow = db.prepare("SELECT extinguisher_id FROM cases WHERE id = ?").get(id);
      if (caseRow) {
        db.prepare(`
          UPDATE extinguishers 
          SET notes = notes || ' [Reemplazado temporalmente por ' || ? || ']'
          WHERE id = ?
        `).run(temp_replacement_code, caseRow.extinguisher_id);
      }
    }

    res.json({ success: true, message: 'Caso actualizado con éxito' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
