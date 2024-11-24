const CHANNELS_PER_PAGE = 50;
let channels = [];
let currentPage = 1;
let currentGroup = 'all';
let searchQuery = '';

// Fetch the local M3U playlist securely
fetch('M3UPlus-Playlist-20241019222427.m3u')
    .then(response => {
        if (!response.ok) throw new Error(`Error: ${response.statusText}`);
        return response.text();
    })
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
            // Push the last channel if valid
            if (currentChannel.name) parsedChannels.push(currentChannel);

            currentChannel = {}; // Reset for new channel

            const nameMatch = line.match(/,(.+)$/);
            const logoMatch = line.match(/tvg-logo="([^"]*)"/);
            const groupMatch = line.match(/group-title="([^"]*)"/);

            if (nameMatch) currentChannel.name = nameMatch[1].trim();
            currentChannel.logo = logoMatch ? logoMatch[1] : '';
            currentChannel.group = groupMatch ? groupMatch[1] : 'Ungrouped';
        } else if (line && !line.startsWith('#')) {
            currentChannel.url = line.trim();
        }
    });

    // Push the last channel
    if (currentChannel.name) parsedChannels.push(currentChannel);
    return parsedChannels;
}

// Populate group select options
function populateGroups() {
    const groupSelect = document.getElementById('group-select');
    const groups = Array.from(new Set(channels.map(channel => channel.group || 'Ungrouped')));
    
    // Add default "All" group option
    const allOption = document.createElement('option');
    allOption.value = 'all';
    allOption.textContent = 'All';
    groupSelect.appendChild(allOption);

    groups.forEach(group => {
        const option = document.createElement('option');
        option.value = group;
        option.textContent = group;
        groupSelect.appendChild(option);
    });
}

// Display channels with pagination, search, and group filtering
function displayChannels() {
    const container = document.getElementById('channel-list');
    container.innerHTML = ''; // Clear current channels

    const filteredChannels = channels.filter(channel =>
        (currentGroup === 'all' || channel.group === currentGroup) &&
        (!searchQuery || channel.name.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const start = (currentPage - 1) * CHANNELS_PER_PAGE;
    const end = Math.min(start + CHANNELS_PER_PAGE, filteredChannels.length);
    const pageChannels = filteredChannels.slice(start, end);

    pageChannels.forEach(channel => {
        const channelDiv = document.createElement('div');
        channelDiv.classList.add('channel');
        channelDiv.innerHTML = `
            <img src="${channel.logo || 'default_logo.png'}" alt="${channel.name}" class="channel-logo" onclick="playStream('${encodeURIComponent(channel.url)}', '${encodeURIComponent(channel.name)}')">
            <p>${channel.name}</p>
        `;
        container.appendChild(channelDiv);
    });

    // Update pagination info
    const totalPages = Math.ceil(filteredChannels.length / CHANNELS_PER_PAGE);
    document.getElementById('page-info').textContent = `Page ${currentPage} of ${totalPages}`;
    document.getElementById('prev-page').disabled = currentPage === 1;
    document.getElementById('next-page').disabled = currentPage === totalPages;
}

// Handle search input
document.getElementById('search-input').addEventListener('input', (e) => {
    searchQuery = e.target.value.trim();
    currentPage = 1;
    displayChannels();
});

// Handle group selection
document.getElementById('group-select').addEventListener('change', (e) => {
    currentGroup = e.target.value;
    currentPage = 1;
    displayChannels();
});

// Pagination controls
document.getElementById('prev-page').addEventListener('click', () => {
    if (currentPage > 1) {
        currentPage--;
        displayChannels();
    }
});

document.getElementById('next-page').addEventListener('click', () => {
    const maxPage = Math.ceil(channels.filter(channel =>
        (currentGroup === 'all' || channel.group === currentGroup) &&
        (!searchQuery || channel.name.toLowerCase().includes(searchQuery.toLowerCase()))
    ).length / CHANNELS_PER_PAGE);

    if (currentPage < maxPage) {
        currentPage++;
        displayChannels();
    }
});

// Play stream securely
function playStream(url, name) {
    const sanitizedUrl = encodeURIComponent(url);
    const sanitizedName = encodeURIComponent(name);
    const proxyUrl = `proxy.html?url=${sanitizedUrl}&name=${sanitizedName}`;
    window.location.href = proxyUrl;
}
