const STORAGE_KEY = 'inventory_data';
const LOW_STOCK_THRESHOLD = 5;

// LOAD ITEMS ON STARTUP
document.addEventListener('DOMContentLoaded', () => {
    loadFromStorage();
});

// SHOW / HIDE LOADER (Simulated for UX)
function showLoader(show) {
    const l = document.getElementById('loader');
    if (l) l.style.display = show ? 'block' : 'none';
}

function getLowStockBadge(qty) {
    return qty <= LOW_STOCK_THRESHOLD ? `<span class="badge-low">⚠️ Low</span>` : '';
}

// HELPER: GET DATA FROM STORAGE
function getStoredItems() {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
}

// HELPER: SAVE DATA TO STORAGE
function saveToStorage(items) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

// RENDER ALL ITEMS
function loadFromStorage() {
    const tbody = document.getElementById('inventoryBody');
    tbody.innerHTML = ''; // Clear current table
    
    const items = getStoredItems();

    if (items.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty-msg">No items found.</td></tr>';
        return;
    }

    items.forEach(item => renderSingleItem(item));
}

function renderSingleItem(item) {
    const tbody = document.getElementById('inventoryBody');
    
    // Remove "No items" message if it exists
    const emptyMsg = tbody.querySelector('.empty-msg');
    if (emptyMsg) emptyMsg.closest('tr').remove();

    const row = document.createElement('tr');
    row.dataset.id = item.id; // Store ID in the row for easy access
    if (item.qty <= LOW_STOCK_THRESHOLD) row.classList.add('low-stock-row');

    row.innerHTML = `
        <td>${item.id}</td>
        <td>${item.name}</td>
        <td>${item.qty} ${getLowStockBadge(item.qty)}</td>
        <td>PHP ${parseFloat(item.price).toFixed(2)}</td>
        <td>PHP ${(item.qty * item.price).toFixed(2)}</td>
        <td>
            <button onclick="updateItem(${item.id}, this)">Edit</button>
            <button onclick="deleteItem(${item.id}, this)" class="btn-del">Delete</button>
        </td>
    `;
    tbody.appendChild(row);
}

// REFRESH BUTTON (Reloads from LocalStorage)
function fetchInventory() {
    showLoader(true);
    setTimeout(() => {
        loadFromStorage();
        showLoader(false);
    }, 400); // Fake delay to show the loader
}

// ADD ITEM
function createItem() {
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
        id: Date.now(), // Unique ID based on timestamp
        name: name, 
        qty: qty, 
        price: price 
    };

    // 1. Get current list
    const items = getStoredItems();
    // 2. Add new item
    items.push(newItem);
    // 3. Save back to storage
    saveToStorage(items);

    // 4. Update UI
    renderSingleItem(newItem);
    
    // Clear inputs
    nameInput.value = ''; 
    qtyInput.value = ''; 
    priceInput.value = '';
}

// CLEAR ALL
function clearServerItems() {
    if (confirm('Clear all items from storage? This cannot be undone.')) {
        localStorage.removeItem(STORAGE_KEY);
        loadFromStorage(); // Renders the "No items" message
    }
}

// UPDATE ITEM
function updateItem(id, btn) {
    const items = getStoredItems();
    const itemIndex = items.findIndex(i => i.id === id);
    
    if (itemIndex === -1) {
        alert("Item not found!");
        return;
    }

    const currentItem = items[itemIndex];

    const newName = prompt('Enter new name:', currentItem.name);
    if (!newName) return;
    
    const newQtyStr = prompt('Enter new quantity:', currentItem.qty);
    const newQty = parseInt(newQtyStr);
    if (isNaN(newQty)) return;

    const newPriceStr = prompt('Enter new price:', currentItem.price);
    const newPrice = parseFloat(newPriceStr);
    if (isNaN(newPrice)) return;

    // Update data object
    items[itemIndex] = { ...currentItem, name: newName, qty: newQty, price: newPrice };
    
    // Save to storage
    saveToStorage(items);
    
    // Refresh UI
    fetchInventory(); 
}

// DELETE ITEM
function deleteItem(id, btn) {
    if (!confirm('Delete this item?')) return;

    // 1. Get items
    const items = getStoredItems();
    // 2. Filter out the deleted item
    const updatedItems = items.filter(i => i.id !== id);
    // 3. Save
    saveToStorage(updatedItems);
    
    // 4. Update UI (Remove row)
    const row = btn.closest('tr');
    row.remove();

    // Check if empty
    const tbody = document.getElementById('inventoryBody');
    if (tbody.rows.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty-msg">No items found.</td></tr>';
    }
}
