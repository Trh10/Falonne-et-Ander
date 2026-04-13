const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'guests.json');

// Servir les fichiers statiques (index.html, bienvenue.html, images, musique...)
app.use(express.static(__dirname));
app.use(express.json());

// — Lire les invités —
function readGuests() {
    try {
        return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    } catch {
        return [];
    }
}

// — Sauvegarder les invités —
function saveGuests(guests) {
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(guests, null, 2), 'utf8');
}

// GET /api/guests — récupérer toute la liste
app.get('/api/guests', (req, res) => {
    res.json(readGuests());
});

// POST /api/guests — ajouter un invité
app.post('/api/guests', (req, res) => {
    const { name, status, nb, detail, code, msg } = req.body;
    if (!name || typeof name !== 'string') {
        return res.status(400).json({ error: 'Nom requis' });
    }
    const guests = readGuests();
    // Éviter les doublons par code
    if (code && guests.some(g => g.code === code)) {
        return res.json({ success: true, duplicate: true });
    }
    guests.push({
        date: new Date().toISOString(),
        name: String(name).substring(0, 200),
        status: status === 'non' ? 'non' : 'oui',
        nb: Math.min(Math.max(parseInt(nb) || 1, 1), 10),
        detail: String(detail || '').substring(0, 500),
        code: String(code || '').substring(0, 20),
        msg: String(msg || '').substring(0, 1000)
    });
    saveGuests(guests);
    res.json({ success: true });
});

// DELETE /api/guests/:code — supprimer un invité
app.delete('/api/guests/:code', (req, res) => {
    const guests = readGuests();
    const idx = guests.findIndex(g => g.code === req.params.code);
    if (idx >= 0) {
        guests.splice(idx, 1);
        saveGuests(guests);
    }
    res.json({ success: true });
});

app.listen(PORT, () => {
    console.log('Serveur mariage F&A sur le port ' + PORT);
});
