const CHANNELS_PER_PAGE = 50;
let channels = [];
let currentPage = 1;
let currentGroup = 'all';
let searchQuery = '';

// Fetch the local M3U playlist
fetch('M3UPlus-Playlist-20241019222427.m3u')
    .then(response => response.ok ? response.text() : Promise.reject(response.statusText))
    .then(data => {
        channels = parseM3U(data);
        populateGroups();
        displayChannels();
    })
    .catch(error => console.error('Error fetching M3U file:', error));

// Parse the M3U file
function parseM3U(data) {
    const lines = data.split('\n');
    const parsedChannels = [];
    let currentChannel = {};

    lines.forEach(line => {
        line = line.trim();

        if (line.startsWith('#EXTINF:')) {
            if (currentChannel.name && currentChannel.url) parsedChannels.push(currentChannel);
            currentChannel = {};
            const nameMatch = line.match(/,(.+)$/);
            const logoMatch = line.match(/tvg-logo="([^"]*)"/);
            const groupMatch = line.match(/group-title="([^"]*)"/);

            if (nameMatch) currentChannel.name = nameMatch[1].trim();
            currentChannel.logo = logoMatch ? logoMatch[1] : '';
            currentChannel.group = groupMatch ? groupMatch[1] : 'Ungrouped';
        } else if (line && !line.startsWith('#')) {
            currentChannel.url = line;
        }
    });

    if (currentChannel.name && currentChannel.url) parsedChannels.push(currentChannel);
    return parsedChannels;
}
