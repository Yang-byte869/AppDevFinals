const API_URL = 'https://jsonplaceholder.typicode.com/posts';
const LOW_STOCK_THRESHOLD = 5;

// SHOW / HIDE LOADER
function showLoader(show) {
    const l = document.getElementById('loader');
    if (l) l.style.display = show ? 'block' : 'none';
}

function getLowStockBadge(qty) {
    return qty <= LOW_STOCK_THRESHOLD ? `<span class="badge-low">⚠️ Low</span>` : '';
}


function renderSingleItem(item) {
    const tbody = document.getElementById('inventoryBody');
    
    // Remove "No items" message if it exists
    if (tbody.querySelector('.empty-msg')) tbody.innerHTML = '';

    const row = document.createElement('tr');
    if (item.qty <= LOW_STOCK_THRESHOLD) row.classList.add('low-stock-row');

    row.innerHTML = `
        <td>${item.id}</td>
        <td>${item.name}</td>
        <td>${item.qty} ${getLowStockBadge(item.qty)}</td>
        <td>PHP ${item.price.toFixed(2)}</td>
        <td>PHP ${(item.qty * item.price).toFixed(2)}</td>
        <td>
            <button onclick="updateItem(${item.id}, this)">Edit</button>
            <button onclick="deleteItem(${item.id}, this)">Delete</button>
        </td>
    `;
    tbody.appendChild(row);
}


function fetchInventory() {
    const tbody = document.getElementById('inventoryBody');
    const rows = tbody.querySelectorAll('tr');

    if (rows.length === 0 || tbody.querySelector('.empty-msg')) {
        alert("No items to refresh.");
        return;
    }

    showLoader(true);
    setTimeout(() => {
        rows.forEach(row => {
            const qtyCell = row.cells[2];
            const qty = parseInt(qtyCell.textContent);

            if (!isNaN(qty)) {
                if (qty <= LOW_STOCK_THRESHOLD) {
                    row.classList.add('low-stock-row');
                    if (!qtyCell.innerHTML.includes('badge-low')) {
                        qtyCell.innerHTML = `${qty} <span class="badge-low">⚠️ Low</span>`;
                    }
                } else {
                    row.classList.remove('low-stock-row');
                    qtyCell.innerHTML = qty;
                }
            }
        });
        showLoader(false);
    }, 400);
}

// ADD ITEM
async function createItem() {
    const nameInput = document.getElementById('itemName');
    const qtyInput = document.getElementById('itemQty');
    const priceInput = document.getElementById('itemPrice');

    const name = nameInput.value.trim();
    const qty = parseInt(qtyInput.value);
    const price = parseFloat(priceInput.value);

    if (!name || isNaN(qty) || isNaN(price)) {
        alert('Please fill all fields correctly');
        return;
    }

    const newItem = { 
        id: Math.floor(Math.random() * 10000), 
        name: name, 
        qty: qty, 
        price: price 
    };

    showLoader(true);
    try {
        await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json; charset=UTF-8' },
            body: JSON.stringify({ title: name, body: JSON.stringify({ qty, price }) })
        });
        renderSingleItem(newItem); // Now this works!
        nameInput.value = ''; qtyInput.value = ''; priceInput.value = '';
    } catch (err) {
        console.error('Add failed', err);
    } finally {
        showLoader(false);
    }
}


function clearServerItems() {
    if (confirm('Clear all items from the display?')) {
        const tbody = document.getElementById('inventoryBody');
        tbody.innerHTML = '<tr><td colspan="6" class="empty-msg">No items found.</td></tr>';
    }
}


async function updateItem(id, btn) {
    const row = btn.closest('tr');
    const currentName = row.cells[1].textContent;
    const currentQty = parseInt(row.cells[2].textContent);
    const currentPrice = row.cells[3].textContent.replace('PHP ', '');

    const newName = prompt('Enter new name:', currentName);
    if (!newName) return;
    const newQty = parseInt(prompt('Enter new quantity:', currentQty));
    if (isNaN(newQty)) return;
    const newPrice = parseFloat(prompt('Enter new price:', currentPrice));
    if (isNaN(newPrice)) return;

    showLoader(true);
    try {
        await fetch(`${API_URL}/1`, { 
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json; charset=UTF-8' },
            body: JSON.stringify({ title: newName, body: JSON.stringify({ qty: newQty, price: newPrice }) })
        });

        row.cells[1].textContent = newName;
        row.cells[2].innerHTML = `${newQty} ${getLowStockBadge(newQty)}`;
        row.cells[3].textContent = `PHP ${newPrice.toFixed(2)}`;
        row.cells[4].textContent = `PHP ${(newQty * newPrice).toFixed(2)}`;

        if (newQty <= LOW_STOCK_THRESHOLD) row.classList.add('low-stock-row');
        else row.classList.remove('low-stock-row');

    } catch (err) {
        console.error('Update failed', err);
    } finally {
        showLoader(false);
    }
}

// DELETE ITEM
async function deleteItem(id, btn) {
    if (!confirm('Delete this item?')) return;
    btn.closest('tr').remove();
    const tbody = document.getElementById('inventoryBody');
    if (tbody.rows.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty-msg">No items found.</td></tr>';
    }
}
