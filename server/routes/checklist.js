const express = require('express');
const router = express.Router();
const { db } = require('../db');

// GET all active checklist items
router.get('/', (req, res) => {
  try {
    const { type } = req.query;
    let items = db.prepare("SELECT * FROM checklist_items WHERE is_active = 1 ORDER BY order_index ASC").all();

    if (type) {
      items = items.filter(item => {
        if (!item.applicable_types || item.applicable_types === 'ALL') return true;
        try {
          const types = JSON.parse(item.applicable_types);
          return types.includes(type);
        } catch (e) {
          return item.applicable_types.includes(type);
        }
      });
    }

    res.json({
      success: true,
      disclaimer: "Validar checklist y plazos con el responsable de Seguridad e Higiene y la normativa aplicable.",
      items
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST new checklist item
router.post('/', (req, res) => {
  try {
    const { code, label, description, applicable_types = 'ALL', is_required = 1, order_index = 0 } = req.body;
    if (!code || !label) {
      return res.status(400).json({ success: false, error: 'Código y etiqueta son requeridos' });
    }

    const insert = db.prepare(`
      INSERT INTO checklist_items (code, label, description, applicable_types, is_required, order_index)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    insert.run(code.toLowerCase().trim(), label.trim(), description || '', applicable_types, is_required, order_index);
    res.json({ success: true, message: 'Ítem de checklist creado con éxito' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
