const express = require('express');
const app = express();
const https = require('https');
const ALLOWED_DOMAINS = ['trustedsite.com', 'example.com']; // Add trusted domains here.

app.get('/api/proxy', (req, res) => {
    const url = req.query.url;

    if (!url || !ALLOWED_DOMAINS.some(domain => url.includes(domain))) {
        return res.status(400).json({ error: 'Invalid or disallowed URL' });
    }

    https.get(url, (streamResponse) => {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Content-Type', streamResponse.headers['content-type']);
        streamResponse.pipe(res);
    }).on('error', (err) => {
        res.status(500).json({ error: 'Failed to fetch the stream' });
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Proxy server running on port ${PORT}`);
});
