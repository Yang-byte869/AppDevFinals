// Helper to show/hide loader
function showLoader(show) {
    const l = document.getElementById('loader');
    if (l) l.style.display = show ? 'block' : 'none';
}

// READ
async function fetchInventory() {
    showLoader(true);
    try {
        const res = await fetch(`${API_URL}?_limit=10`);
        const data = await res.json();
        
        const parsed = data.map(d => {
            let qty = 0, price = 0.00;
            try {
                const parsedBody = JSON.parse(d.body);
                qty = parseInt(parsedBody.qty) || 0;
                price = parseFloat(parsedBody.price) || 0.00;
            } catch(e) {
                
                qty = parseInt(d.body) || 0;
            }
            return { id: d.id, name: d.title, qty, price };
        });
        renderTable(parsed);
    } catch (err) {
        console.error('Fetch failed', err);

        // Silent failure: show empty list instead of alerting
        
        renderTable([]);
    } finally {
        showLoader(false);
    }
}

// CREATE
async function createItem() {
    const name = document.getElementById('itemName').value.trim();
    const qty = parseInt(document.getElementById('itemQty').value);
    const price = parseFloat(document.getElementById('itemPrice').value);

    if (!name || isNaN(qty) || isNaN(price)) {
        alert('Please fill all fields correctly');
        return;
    }

    const payload = { title: name, body: JSON.stringify({ qty, price }), userId: 1 };

    showLoader(true);
    try {
        const res = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json; charset=UTF-8' },
            body: JSON.stringify(payload)
        });
        const created = await res.json();
        // Re-fetch to reflect server state (silent)
        await fetchInventory();
        document.getElementById('itemName').value = '';
        document.getElementById('itemQty').value = '';
        document.getElementById('itemPrice').value = '';
    } catch (err) {
        console.error('Create failed', err);
        // silent failure
    } finally {
        showLoader(false);
    }
}

// UPDATE
async function updateItem(id) {
    const newName = prompt('New name:');
    if (newName === null) return; // cancelled
    const newQtyRaw = prompt('New quantity:');
    if (newQtyRaw === null) return;
    const newPriceRaw = prompt('New price:');
    if (newPriceRaw === null) return;

    const newQty = parseInt(newQtyRaw);
    const newPrice = parseFloat(newPriceRaw);
    if (!newName.trim() || isNaN(newQty) || isNaN(newPrice)) {
        alert('Invalid input');
        return;
    }

    showLoader(true);
    try {
        await fetch(`${API_URL}/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json; charset=UTF-8' },
            body: JSON.stringify({ title: newName, body: JSON.stringify({ qty: newQty, price: newPrice }) })
        });
        await fetchInventory();
    } catch (err) {
        console.error('Update failed', err);
        // silent failure
    } finally {
        showLoader(false);
    }
}

// DELETE single
async function deleteItem(id, element) {
    if (!confirm('Delete this item?')) return;
    // Remove row locally for instant feedback, regardless of network outcome
    if (element && element.closest) element.closest('tr').remove();
    showLoader(true);
    try {
        await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
        // silent success
    } catch (err) {
        console.error('Delete failed', err);
        // silent failure - row already removed locally
    } finally {
        showLoader(false);
    }
} 

// DELETE all displayed items
async function clearServerItems() {
    if (!confirm('Delete all displayed items on server?')) return;
    const body = document.getElementById('inventoryBody');
    const ids = Array.from(body.querySelectorAll('tr td:first-child')).map(td => td.textContent.trim());
    // Remove rows locally immediately for a quiet UX
    body.innerHTML = '';
    showLoader(true);
    try {
        await Promise.all(ids.map(id => fetch(`${API_URL}/${id}`, { method: 'DELETE' })));
        // silent success
    } catch (err) {
        console.error('Failed to clear items', err);
        // silent failure
    } finally {
        showLoader(false);
    }
} 

// Render
function renderTable(items) {
    const tbody = document.getElementById('inventoryBody');
    tbody.innerHTML = '';
    if (!items || items.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty-msg">No items found.</td></tr>';
        return;
    }

    items.forEach(item => {
        const total = (item.qty * item.price).toFixed(2);
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.id}</td>
            <td>${item.name}</td>
            <td>${item.qty}</td>
            <td>PHP ${item.price.toFixed(2)}</td>
            <td>PHP ${total}</td>
            <td>
                <button class="btn-edit" onclick="updateItem(${item.id})">Edit</button>
                <button class="btn-del" onclick="deleteItem(${item.id}, this)">Delete</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Initial load: show empty table (no automatic example fetch)
window.addEventListener('DOMContentLoaded', () => renderTable([]));