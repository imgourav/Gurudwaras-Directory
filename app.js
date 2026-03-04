const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQR8iULzLAdx3ZELtgDcpSUWZfC4FeaJD6Ir_7LyHEM13odXXW5NrBEX5PDs7KtT_JYrKSrU5rg13Qc/pub?output=csv';

let gurudwarasData = [];

// Helper to parse CSV properly handling quotes
function parseCSV(text) {
    const result = [];
    let row = [];
    let currentCell = '';
    let insideQuotes = false;

    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const nextChar = text[i + 1];

        if (char === '"') {
            if (insideQuotes && nextChar === '"') {
                // Escaped quote
                currentCell += '"';
                i++; // Skip the next quote
            } else {
                // Toggle quote state
                insideQuotes = !insideQuotes;
            }
        } else if (char === ',' && !insideQuotes) {
            // End of cell
            row.push(currentCell.trim());
            currentCell = '';
        } else if (char === '\n' && !insideQuotes) {
            // End of row
            // Check for \r before \n
            if (currentCell.endsWith('\r')) {
                currentCell = currentCell.slice(0, -1);
            }
            row.push(currentCell.trim());
            if (row.length > 0 && row.some(cell => cell !== '')) {
                result.push(row);
            }
            row = [];
            currentCell = '';
        } else {
            // Normal character
            currentCell += char;
        }
    }
    
    // Push the last cell/row if not empty
    if (currentCell !== '') {
        if (currentCell.endsWith('\r')) {
            currentCell = currentCell.slice(0, -1);
        }
        row.push(currentCell.trim());
    }
    if (row.length > 0 && row.some(cell => cell !== '')) {
        result.push(row);
    }

    return result;
}

// Convert Array of Arrays to Array of Objects using the header row
function csvToJson(csvArray) {
    if (!csvArray || csvArray.length < 2) return [];
    
    const headers = csvArray[0];
    const dataRows = csvArray.slice(1);
    
    return dataRows.map(row => {
        const obj = {};
        headers.forEach((header, index) => {
            let val = row[index] || '';
            // Convert boolean strings to actual booleans
            if (val.toUpperCase() === 'TRUE') val = true;
            if (val.toUpperCase() === 'FALSE') val = false;
            obj[header] = val;
        });
        return obj;
    });
}

// Fetch and load data
async function fetchGurudwaraData() {
    try {
        const response = await fetch(SHEET_CSV_URL);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const text = await response.text();
        const csvArray = parseCSV(text);
        gurudwarasData = csvToJson(csvArray);
        
        console.log("Loaded data:", gurudwarasData);
        return gurudwarasData;
    } catch (error) {
        console.error("Error fetching data:", error);
        return [];
    }
}

// Render Featured Cards (Homepage)
function renderFeaturedCards(data) {
    const container = document.querySelector('.featured-cards');
    if (!container) return; // Not on the homepage
    
    const featuredDocs = data.filter(g => g.isFeatured === true || g.isFeatured === 'TRUE' || g.isFeatured === 'true');
    
    if (featuredDocs.length === 0) {
        document.querySelector('.featured-section').style.display = 'none';
        return;
    }

    // Default gradients for aesthetic placeholders if no image is present
    const gradients = [
        'linear-gradient(to bottom right, #FFD54F, #FF8F00)',
        'linear-gradient(to bottom right, #4DD0E1, #0097A7)',
        'linear-gradient(to bottom right, #81C784, #388E3C)',
        'linear-gradient(to bottom right, #FF8A65, #D84315)'
    ];

    container.innerHTML = featuredDocs.map((gurudwara, index) => {
        const gradient = gradients[index % gradients.length];
        const imgStyle = gurudwara.image_url 
            ? `background-image: url('${gurudwara.image_url}'); background-size: cover; background-position: center;` 
            : `background: ${gradient};`;

        return `
            <div class="featured-card" onclick="window.location.href='details.html?id=${gurudwara.id}'">
                <div class="featured-img" style="${imgStyle}"></div>
                <div class="featured-info">
                    <h4>${gurudwara.name}</h4>
                    <p>${gurudwara.city}</p>
                </div>
            </div>
        `;
    }).join('');
}

// Render All Listing Cards (Homepage)
function renderListingCards(data) {
    const container = document.querySelector('.list-section');
    if (!container) return; // Not on the homepage

    // Remove existing cards
    const existingCards = container.querySelectorAll('.card');
    existingCards.forEach(c => c.remove());

    const cardsHtml = data.map(gurudwara => {
        const langarBadge = (gurudwara.langarAvailable === true || gurudwara.langarAvailable === 'TRUE' || gurudwara.langarAvailable === 'true' || gurudwara.langarAvailable === 'Yes') 
            ? `
            <div class="langar-badge">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                Langar Available
            </div>` : '';

        return `
            <div class="card">
                <h3>${gurudwara.name}</h3>
                <div class="card-location">${gurudwara.city}, ${gurudwara.state}</div>
                
                <div class="card-details">
                    <div class="detail-item">
                        <svg class="detail-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                        <span>${gurudwara.timings || 'Open'}</span>
                    </div>
                    <div class="detail-item">
                        <svg class="detail-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                        <span>${gurudwara.contact || 'N/A'}</span>
                    </div>
                </div>

                ${langarBadge}

                <a href="details.html?id=${gurudwara.id}" class="btn-outline">View Details</a>
            </div>
        `;
    }).join('');

    container.insertAdjacentHTML('beforeend', cardsHtml);
}

// Render details page
function renderDetailsPage(data) {
    if (!document.querySelector('.details-title')) return; // Not on the details page

    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');

    if (!id) return; // No ID provided

    const gurudwara = data.find(g => g.id === id);
    if (!gurudwara) {
        document.querySelector('.details-title').innerHTML = "Gurudwara not found";
        return;
    }

    // Populate data
    document.querySelector('.details-title').innerHTML = gurudwara.name.replace(' (', '<br>(');
    document.querySelector('.breadcrumb span').textContent = gurudwara.name;
    
    if (gurudwara.image_url) {
        document.getElementById('hero-img').src = gurudwara.image_url;
    }

    // Populate Info Table
    const tableHtml = `
        <li class="info-row"><div class="info-label">City</div><div class="info-value">${gurudwara.city}</div></li>
        <li class="info-row"><div class="info-label">State</div><div class="info-value">${gurudwara.state}</div></li>
        <li class="info-row"><div class="info-label">Address</div><div class="info-value">${gurudwara.address}</div></li>
        <li class="info-row"><div class="info-label">Contact</div><div class="info-value">${gurudwara.contact || '-'}</div></li>
        <li class="info-row"><div class="info-label">Timings</div><div class="info-value">${gurudwara.timings || '-'}</div></li>
        <li class="info-row"><div class="info-label">Langar</div><div class="info-value">${(gurudwara.langarAvailable === true || gurudwara.langarAvailable === 'TRUE' || gurudwara.langarAvailable === 'true' || gurudwara.langarAvailable === 'Yes') ? 'Yes' : 'No'}</div></li>
        ${gurudwara.specialEvents ? `<li class="info-row"><div class="info-label">Special Events</div><div class="info-value">${gurudwara.specialEvents}</div></li>` : ''}
    `;
    document.querySelector('.info-table').innerHTML = tableHtml;

    // Description
    if (gurudwara.description) {
        document.querySelector('.description-text').textContent = gurudwara.description;
    } else {
        document.querySelector('.description-text').textContent = 'No description available.';
    }

    // Map URL
    if (gurudwara.map_url) {
        document.querySelector('.map-placeholder img').src = gurudwara.map_url;
    }
}

// Initialize Application
async function init() {
    const data = await fetchGurudwaraData();
    
    if (data.length > 0) {
        renderFeaturedCards(data);
        renderListingCards(data);
        renderDetailsPage(data);
    }
}

// Run when DOM is fully loaded
document.addEventListener('DOMContentLoaded', init);
