const express = require('express');
const router = express.Router();

// ✅ Event validation helper
function isValidEvent(event) {
  const { title, category, description, eventDate, location, price } = event;
  const now = new Date();

  const parsedDate = new Date(eventDate);
  if (!eventDate || isNaN(parsedDate.getTime()) || parsedDate <= now) {
    return { valid: false, error: 'Event date must be in the future' };
  }

  if (
    !title || typeof title !== 'string' ||
    !category || typeof category !== 'string' ||
    !description || typeof description !== 'string' ||
    !location || typeof location !== 'string' ||
    isNaN(parseFloat(price)) || parseFloat(price) < 0
  ) {
    return { valid: false, error: 'All fields are required and must be valid' };
  }

  return { valid: true };
}

// ✅ GET all events
router.get('/', async (req, res) => {
  try {
    const [events] = await req.app.locals.db.execute(`
      SELECT eventId, title, category, description, eventDate, location, price
      FROM event
      ORDER BY eventDate ASC
    `);
    res.json({ success: true, events });
  } catch (err) {
    console.error('❌ Error loading events:', err);
    res.status(500).json({ success: false, error: 'Failed to load events' });
  }
});

// ✅ GET single event by ID
router.get('/:id', async (req, res) => {
  const eventId = parseInt(req.params.id);
  if (!eventId || isNaN(eventId)) {
    return res.status(400).json({ success: false, error: 'Invalid event ID' });
  }

  try {
    const [rows] = await req.app.locals.db.execute(
      'SELECT * FROM event WHERE eventId = ?',
      [eventId]
    );

    if (!rows.length) {
      return res.status(404).json({ success: false, error: 'Event not found' });
    }

    res.json({ success: true, event: rows[0] });
  } catch (err) {
    console.error('❌ Error fetching single event:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch event' });
  }
});

// ✅ CREATE new event
router.post('/', async (req, res) => {
  const event = req.body;
  const validation = isValidEvent(event);

  if (!validation.valid) {
    return res.status(400).json({ success: false, error: validation.error });
  }

  try {
    const [result] = await req.app.locals.db.execute(
      `INSERT INTO event (title, category, description, eventDate, location, price)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        event.title,
        event.category,
        event.description,
        event.eventDate,
        event.location,
        event.price
      ]
    );

    res.json({ success: true, message: 'Event created', eventId: result.insertId });
  } catch (err) {
    console.error('❌ Error creating event:', err);
    res.status(500).json({ success: false, error: 'Failed to create event' });
  }
});

// ✅ UPDATE event
router.put('/:id', async (req, res) => {
  const eventId = parseInt(req.params.id);
  const event = req.body;
  const validation = isValidEvent(event);

  if (!eventId || isNaN(eventId) || !validation.valid) {
    return res.status(400).json({ success: false, error: validation.error || 'Invalid data' });
  }

  try {
    const [result] = await req.app.locals.db.execute(
      `UPDATE event 
       SET title = ?, category = ?, description = ?, eventDate = ?, location = ?, price = ?
       WHERE eventId = ?`,
      [
        event.title,
        event.category,
        event.description,
        event.eventDate,
        event.location,
        event.price,
        eventId
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Event not found' });
    }

    res.json({ success: true, message: 'Event updated' });
  } catch (err) {
    console.error('❌ Error updating event:', err);
    res.status(500).json({ success: false, error: 'Failed to update event' });
  }
});

// ✅ DELETE event
router.delete('/:id', async (req, res) => {
  const eventId = parseInt(req.params.id);

  if (!eventId || isNaN(eventId)) {
    return res.status(400).json({ success: false, error: 'Invalid event ID' });
  }

  try {
    const [result] = await req.app.locals.db.execute(
      'DELETE FROM event WHERE eventId = ?', [eventId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Event not found' });
    }

    res.json({ success: true, message: 'Event deleted' });
  } catch (err) {
    console.error('❌ Error deleting event:', err);
    res.status(500).json({ success: false, error: 'Failed to delete event' });
  }
});

module.exports = router;
