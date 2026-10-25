const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();

app.use(cors());

// Endpoint to extract direct video links
app.get('/extract', async (req, res) => {
    const videoUrl = req.query.url;
    if (!videoUrl) return res.status(400).json({ error: 'URL is required' });

    try {
        // Fetch the HTML of the embed page
        const response = await axios.get(videoUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Referer': videoUrl // Fake referer to bypass hotlink protection
            }
        });

        const html = response.data;

        // Regex to find m3u8 or mp4 links
        const m3u8Match = html.match(/(https?:\/\/[^"']+\.m3u8[^"']*)/i);
        const mp4Match = html.match(/(https?:\/\/[^"']+\.mp4[^"']*)/i);

        if (m3u8Match || mp4Match) {
            const directLink = m3u8Match ? m3u8Match[0] : mp4Match[0];
            return res.json({ success: true, directUrl: directLink });
        }

        return res.status(404).json({ success: false, error: 'No direct video link found' });

    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
});

// Proxy stream (if the video host blocks your app's CORS)
app.get('/proxy', async (req, res) => {
    const videoUrl = req.query.url;
    if (!videoUrl) return res.status(400).send('URL required');

    try {
        const response = await axios({
            method: 'get',
            url: videoUrl,
            responseType: 'stream',
            headers: {
                'User-Agent': 'Mozilla/5.0',
                'Referer': videoUrl
            }
        });
        response.data.pipe(res);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
