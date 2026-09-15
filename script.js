// This is an IIFE (Immediately Invoked Function Expression).
// da be runs the code right away and keeps everything private inside.
(function() {
    // 'use strict' makes JavaScript more strict (it catches common mistakes)
    'use strict';
    // STORAGE PREFIX: bezawed prefix to every key we save in localStorage.
    // Ex: room "ABC123" is saved as "event_ABC123".
    const STORAGE_PREFIX = 'event_';

    // GETTING ELEMENTS FROM THE HTML PAGE
    // document.getElementById() finds an element by its id="..." in HTML.
    // We store them in variables so we don't have to look them up again.
    // el berbot el html bel javascript

    // Elements for the dashboard selection screen (create/join)
    const dashboardOverlay = document.getElementById('dashboardOverlay');
    const dashboardError = document.getElementById('dashboardError');     
    const createCode = document.getElementById('createCode');             
    const createBtn = document.getElementById('createBtn');               
    const joinCode = document.getElementById('joinCode');                 
    const joinBtn = document.getElementById('joinBtn');      

    // Elements for the main app screen
    const appContainer = document.getElementById('appContainer');         
    const roomCodeDisplay = document.getElementById('roomCodeDisplay');   
    const userDisplay = document.getElementById('userDisplay');           
    const shareBtn = document.getElementById('shareBtn');                 
    const resetBtn = document.getElementById('resetBtn');              

    // Elements for managing tables
    const newTableInput = document.getElementById('newTableName');        
    const createTableBtn = document.getElementById('createTableBtn');    
    const tabsContainer = document.getElementById('tabsContainer');      
    const noTablesMsg = document.getElementById('noTablesMsg');           
    const tableCountSpan = document.getElementById('tableCount');        

    // Elements for adding items
    const itemNameInput = document.getElementById('itemName');           
    const itemQtyInput = document.getElementById('itemQty');              
    const addBtn = document.getElementById('addBtn');                    

    // Elements for displaying the item list
    const itemList = document.getElementById('itemList');                 
    const totalItemsSpan = document.getElementById('totalItems');         
    const clearBtn = document.getElementById('clearBtn');

    // Elements for the report modal
    const reportBtn = document.getElementById('reportBtn');              
    const reportModal = document.getElementById('reportModal');          
    const closeReportBtn = document.getElementById('closeReportBtn');     
    const reportContent = document.getElementById('reportContent');      

    // Elements for the audit log modal
    const auditLogBtn = document.getElementById('auditLogBtn');           
    const auditModal = document.getElementById('auditModal');            
    const closeAuditBtn = document.getElementById('closeAuditBtn');       
    const auditContent = document.getElementById('auditContent');         
    const clearAuditBtn = document.getElementById('clearAuditBtn');

    // Other elements
    const toast = document.getElementById('toast');                      
    const changeNameBtn = document.getElementById('changeNameBtn'); 

    // STATE: the data our app works with right now
    // data: holds the current dashboard's tables, active table, and audit log.
    let data = { tables: [], activeId: null, auditLog: [] };

    // currentRoom: stores the code of the dashboard we are inside.
    // If it's null, we're still on the selection screen.
    let currentRoom = null;

    // DISPLAY NAME FUNCTIONS
    // These handle the user's name (shown in the audit log).
    // Get the saved display name from localStorage.
    // If nothing is saved, return an empty string ''.
    function getDisplayName() {
        return localStorage.getItem('eventDisplayName') || '';
    }

    // Save the display name and update the UI.
    function setDisplayName(name) {
        // Save to localStorage (trim removes extra spaces).
        localStorage.setItem('eventDisplayName', name.trim());
        // Update the text on screen.
        userDisplay.textContent = '👤 ' + (name.trim() || 'Your Name');
    }

    // Ask the user for their name with a pop-up box.
    function promptForName() {
        const current = getDisplayName(); // put the current name
        // prompt: el pop-up and returns what the user typed (or null if cancelled).
        const name = prompt('Enter your display name (this will appear in the audit log):', current || '');
        // If the user didn't press Cancel (null), save the name.
        if (name !== null) {
            setDisplayName(name);
        }
    }

    // STORAGE HELPERS
    // These functions read and write data from the browser's localStorage.
    // Build the key we use in localStorage for a given room.
    function getRoomKey(room) {
        return STORAGE_PREFIX + room.toUpperCase();
    }

    // Load a room's data from localStorage.
    // el key: get room key 
    // el raw: get the saved text in localStorage. (e.g., '{"tables":[],...}')
    // el JSON.parse(raw): turns the saved text back into an object. (so we can use it like data.tables, data.auditLog, etc.)
    function loadRoomData(room) {
        const key = getRoomKey(room);        
        const raw = localStorage.getItem(key);
        if (raw) {
            try {
                return JSON.parse(raw);
            } catch (e) {
                // If the data is broken, ignore and continue.
            }
        }
        // If nothing was saved, return an empty dashboard.
        return { tables: [], activeId: null, auditLog: [] };
    }

    // Save el data bet3et el room fel localStorage.
    function saveRoomData(room, data) {
        const key = getRoomKey(room);
        // JSON.stringify turns the object into text so we can save it.
        localStorage.setItem(key, JSON.stringify(data));
    }

    // Check if a room already exists in localStorage.
    // Returns true if it exists, false if not.
    function roomExists(room) {
        return localStorage.getItem(getRoomKey(room)) !== null;
    }

    // ENTER / LEAVE A ROOM:
    // Move from the selection screen into the dashboard.
    function enterRoom(room) {
        // Save the room code (uppercase so "abc123" and "ABC123" match).
        currentRoom = room.toUpperCase();
        data = loadRoomData(currentRoom);

        // Hide the selection screen and show the app.
        dashboardOverlay.style.display = 'none';
        appContainer.style.display = 'block';

        // Update the room code display in the header.
        roomCodeDisplay.textContent = '📋 ' + currentRoom;
        roomCodeDisplay.title = 'Click to copy room code';

        // Change the URL hash (the part after #) to include the room.
        // 3lshan ta3rf te bookmark or share the URL.
        if (window.history && window.history.pushState) {
            window.history.pushState({}, '', '#' + currentRoom);
        } else {
            window.location.hash = currentRoom;
        }

        // If the user hasn't set a name, ask them.
        if (!getDisplayName()) {
            setTimeout(promptForName, 300); // Wait 0.3s so the screen shows first
        } else {
            // Otherwise, show the saved name.
            userDisplay.textContent = '👤 ' + getDisplayName();
        }

        // Draw the tables and items on the screen.
        renderAll();
    }

    // Go back to the selection screen.
    function leaveRoom() {
        currentRoom = null;
        dashboardOverlay.style.display = 'flex';
        appContainer.style.display = 'none';

        // Clear the # from the URL.
        if (window.history && window.history.pushState) {
            window.history.pushState({}, '', window.location.pathname);
        } else {
            window.location.hash = '';
        }
    }

    // CREATE / JOIN A ROOM:
    // Create a new dashboard.
    function createRoom() {
        // Get the code the user typed (uppercase) w trim spaces.
        const code = createCode.value.trim().toUpperCase();
        // Validate: must be 6 letters/numbers.
        if (code.length !== 6 || !/^[A-Z0-9]{6}$/.test(code)) {
            dashboardError.textContent = 'Code must be exactly 6 alphanumeric characters.';
            return;
        }

        // Clear any previous errors.
        dashboardError.textContent = '';
        // If the room already exists, tell the user.
        if (roomExists(code)) {
            dashboardError.textContent = 'A dashboard with that code already exists. Please join it or use a different code.';
            return;
        }
        // Create a new empty room in storage.
        saveRoomData(code, { tables: [], activeId: null, auditLog: [] });
        // Enter the room.
        enterRoom(code);
    }

    // Join an existing dashboard.
    function joinRoom() {
        const code = joinCode.value.trim().toUpperCase();
        // Validate the code format.
        if (code.length !== 6 || !/^[A-Z0-9]{6}$/.test(code)) {
            dashboardError.textContent = 'Code must be exactly 6 alphanumeric characters.';
            return;
        }
        dashboardError.textContent = '';
        // If the room doesn't exist, tell the user.
        if (!roomExists(code)) {
            dashboardError.textContent = 'Dashboard not found. Please check the code or create a new one.';
            return;
        }
        // Enter the room.
        enterRoom(code);
    }
    // When "Create" or "Join" button is clicked, run the matching function.
    createBtn.addEventListener('click', createRoom);
    joinBtn.addEventListener('click', joinRoom);
    // If the user presses Enter inside the code inputs, also trigger the button.
    createCode.addEventListener('keydown', (e) => { if (e.key === 'Enter') createRoom(); });
    joinCode.addEventListener('keydown', (e) => { if (e.key === 'Enter') joinRoom(); });

    // SHARE THE ROOM
    // Create a link that contains ALL the data (compressed).
    function shareRoom() {
        if (!currentRoom) return; // Do nothing le ehna mesh fi ay room.
        // Save the latest data first.
        saveRoomData(currentRoom, data);
        // Prepare the payload (data to compress).
        const payload = {
            room: currentRoom,
            data: data
        };
        try {
            // Convert to text.
            const json = JSON.stringify(payload);
            // LZString compresses the text so the URL is short.
            const compressed = LZString.compressToEncodedURIComponent(json);
            // Build the full URL with the compressed data after the #.
            const url = window.location.origin + window.location.pathname + '#' + compressed;
            // Try to copy to clipboard.
            navigator.clipboard.writeText(url).then(() => {
                showToast('📋 Shareable link copied to clipboard!');
            }).catch(() => {
                // If clipboard is blocked, show the link in a prompt.
                prompt('Copy this link to share:', url);
                showToast('Link copied (manual)');
            });
        } catch (e) {
            showToast('Error generating link: ' + e.message);
        }
    }
    shareBtn.addEventListener('click', shareRoom);

    // RESET (delete everything in this room)
    function resetRoom() {
        if (!currentRoom) return;

        // Ask the user to confirm (avoid accidental deletion).
        if (confirm('Delete all data for this dashboard? This cannot be undone.')) {
            // Remove from storage.
            localStorage.removeItem(getRoomKey(currentRoom));
            // Reset our local data.
            data = { tables: [], activeId: null, auditLog: [] };
            // Save empty data.
            saveRoomData(currentRoom, data);
            // Redraw the screen.
            renderAll();
            showToast('Dashboard data cleared.');
        }
    }
    resetBtn.addEventListener('click', resetRoom);

    // COPY ROOM CODE WHEN CLICKED
    roomCodeDisplay.addEventListener('click', () => {
        if (currentRoom) {
            navigator.clipboard.writeText(currentRoom).then(() => {
             showToast('Room code copied!');
            }).catch(() => {
                // Fallback if clipboard is blocked.
                prompt('Copy room code:', currentRoom);
            });
        }
    });
    // Change name button triggers the prompt.
    changeNameBtn.addEventListener('click', promptForName);

    // SAVE DATA (shorthand for saveRoomData)
    function saveData() {
        if (currentRoom) {
            saveRoomData(currentRoom, data);
        }
    }

    // AUDIT LOG
    // Every action is recorded so we know who did what and when.
   function logAction(action, details) {
        // The user's name (or "Anonymous" if they didn't set one).
        const user = getDisplayName() || 'Anonymous';
        // Add a new entry to the log.
        data.auditLog.push({
            timestamp: new Date().toISOString(), // el timestamp
            user: user,                          // el user
            action: action,                      // el action (e.g. "Add Item")
            details: details                     // el Description
        });

        // Keep only the latest 500 entries (avoid growing forever).
        if (data.auditLog.length > 500) {
            data.auditLog = data.auditLog.slice(-500);
        }
        // Save the updated data.
        saveData();
    }

    // HELPER: create a <span> element with a class and text.
    // This avoids using innerHTML (safer against XSS attacks).
    // XSS: lama el attacker ye injects malicious JavaScript ka input that runs in your website.
    // we prevent it by using textContent instead of innerHTML.
    function spanWith(className, text) {
        const s = document.createElement('span');
        s.className = className;
        s.textContent = text;
        return s;
    }

    // LEVENSHTEIN DISTANCE:
    // Measures how different two strings are (number of edits needed).
    // Example: "chair" and "chairs" have distance 1.
    // We use this to suggest similar items.
    // ben compare 2 arrays be ba3d (kelma kelma, rakam rakam)
    // "chair" vs "chairs" → distance = 1 (add one letter)
    // "chair" vs "table" → distance = 4 (very different)
    function levenshteinDistance(s1, s2) {
        const m = s1.length, n = s2.length;
        // Create a 2D array filled with zeros.
        const dp = Array.from({ length: m + 1 }, (_, i) => Array(n + 1).fill(0));
        // Fill the first column and row.
        for (let i = 0; i <= m; i++) dp[i][0] = i;
        for (let j = 0; j <= n; j++) dp[0][j] = j;
        // Compare each character.
        for (let i = 1; i <= m; i++) {
            for (let j = 1; j <= n; j++) {
                dp[i][j] = Math.min(
                    dp[i-1][j] + 1,        // Deletion
                    dp[i][j-1] + 1,        // Insertion
                    dp[i-1][j-1] +         // Substitution
                        (s1[i-1].toLowerCase() !== s2[j-1].toLowerCase() ? 1 : 0)
                );
            }
        }
        return dp[m][n]; 
    }

    // Find an item with a similar name (distance 1 or 2, but not 0).
    function findSimilarItem(name, items) {
        if (items.length === 0) return null;
        let bestMatch = null;
        let bestDist = Infinity;
        const threshold = 2; // Allow up to 2 edits
        for (const item of items) {
            const dist = levenshteinDistance(name, item.name);
            // Must be closer than the current best, within threshold, and not exact.
            if (dist < bestDist && dist <= threshold && dist > 0) {
                bestDist = dist;
                bestMatch = item;
            }
        }
        return bestMatch;
    }

    // RENDER: TABLES
    // Draws the table tabs at the top of the list.
    function renderTabs() {
        // Remove any existing tab buttons (but keep other elements).
        const children = tabsContainer.children;
        for (let i = children.length - 1; i >= 0; i--) {
            if (children[i].classList.contains('tab-btn')) children[i].remove();
        }
        // If no tables, show the "no tables" message.
        if (data.tables.length === 0) {
            noTablesMsg.style.display = 'inline';
            tableCountSpan.textContent = '0 tables';
            return;
        }

        // Otherwise, hide the message and show the count.
        noTablesMsg.style.display = 'none';
        tableCountSpan.textContent = `${data.tables.length} table${data.tables.length > 1 ? 's' : ''}`;
        // Loop through each table and create a button for it.
        data.tables.forEach(table => {
            const btn = document.createElement('button');
            // Highlight the button if it's the active table.
            btn.className = `tab-btn${table.id === data.activeId ? ' active' : ''}`;
            btn.dataset.id = table.id;
            // The table name label.
            const label = spanWith('tab-label', table.name);
            // The ✕ (delete) icon inside the button.
            const delSpan = spanWith('del-tab', '✕');
            delSpan.setAttribute('role', 'button');
            delSpan.setAttribute('aria-label', `Delete table ${table.name}`);
            // Clicking ✕ deletes the table.
            delSpan.addEventListener('click', (e) => {
                e.stopPropagation(); // Don't also trigger the button's click
                deleteTable(table.id);
            });
            // Add label and ✕ to the button.
            btn.appendChild(label);
            btn.appendChild(delSpan);
            // Clicking the button switches to that table.
            btn.addEventListener('click', (e) => {
                if (e.target === delSpan) return; // Ignore clicks on ✕ (already handled)
                switchTable(table.id);
            });
            // Add to the tabs container.
            tabsContainer.appendChild(btn);
        });
    }
    // RENDER: ITEMS
    // Draws the item list for the active table.
    function renderItems() {
        const active = getActiveTable(); // Find the current table
        const fragment = document.createDocumentFragment(); // Faster way to add many elements
        // If no active table or it's empty, show a placeholder message.
        if (!active || active.items.length === 0) {
            const empty = document.createElement('li');
            empty.className = 'empty-state';
            const icon = document.createElement('div');
            icon.className = 'icon';
            icon.textContent = '📭';
            const msg = document.createElement('p');
            msg.textContent = 'No items in this table.';
            empty.appendChild(icon);
            empty.appendChild(msg);
            fragment.appendChild(empty);
        } else {
            // Loop through each item and build a row.
            active.items.forEach((item, index) => {
                const li = document.createElement('li');
                // Item name.
                const nameSpan = document.createElement('span');
                nameSpan.className = 'item-name';
                nameSpan.textContent = item.name || 'Unnamed';
                // Quantity.
                const qtySpan = document.createElement('span');
                qtySpan.className = 'item-qty';
                qtySpan.textContent = Number(item.quantity) || 0;
                // Delete button.
                const actionsDiv = document.createElement('div');
                actionsDiv.className = 'item-actions';
                const removeBtn = document.createElement('button');
                removeBtn.className = 'btn-remove';
                removeBtn.textContent = '✕';
                removeBtn.setAttribute('aria-label', `Remove ${item.name || 'item'}`);
                removeBtn.addEventListener('click', () => removeItemFromActive(index));
                actionsDiv.appendChild(removeBtn);
                // Add everything to the <li>.
                li.appendChild(nameSpan);
                li.appendChild(qtySpan);
                li.appendChild(actionsDiv);
                // Add <li> to our fragment.
                fragment.appendChild(li);
            });
        }
        // Clear the list and add the new items.
        while (itemList.firstChild) itemList.removeChild(itemList.firstChild);
        itemList.appendChild(fragment);
        // Update the total count.
        const count = active ? active.items.length : 0;
        totalItemsSpan.textContent = `Total: ${count}`;
    }
    // Redraws everything (tabs + items) and disables the form if no tables exist.
    function renderAll() {
        renderTabs();
        renderItems();
        // Find all inputs/buttons inside the item form.
        const inputs = document.querySelectorAll('#itemForm input, #itemForm button');
        // Disable them if there are no tables.
        const disabled = data.tables.length === 0;
        inputs.forEach(el => el.disabled = disabled);
        // Change the placeholder text accordingly.
        if (disabled) {
            itemNameInput.placeholder = 'Create a table first';
            itemNameInput.value = '';
        } else {
            itemNameInput.placeholder = 'e.g. Plates';
        }
    }
    // Returns the currently active table object.
    function getActiveTable() {
        return data.tables.find(t => t.id === data.activeId) || null;
    }
    // Creates a unique id for a new table.
    // Combines the current time and random characters.
    function generateId() {
        return 't_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
    }

    // CREATE A TABLE
    function createTable(name) {
        const trimmed = name.trim();
        // Validation: empty name.
        if (!trimmed) {
            showToast('Please enter a table name.');
            return false;
        }
        // Validation: too long.
        if (trimmed.length > 60) {
            showToast('Table name must be 60 characters or fewer.');
            return false;
        }
        // Validation: duplicate name.
        if (data.tables.some(t => t.name.toLowerCase() === trimmed.toLowerCase())) {
            showToast(`Table "${trimmed}" already exists.`);
            return false;
        }
        // Create the new table object.
        // we ben generateId() 3lshan kol table ye3ml id unique
        const newTable = { id: generateId(), name: trimmed, items: [] };
        // Add it and make it the active table.
        data.tables.push(newTable);
        data.activeId = newTable.id;
        // Save and redraw.
        saveData();
        renderAll();
        // Record action and show feedback.
        logAction('Create Table', `Table "${trimmed}" created`);
        showToast(`Table "${trimmed}" created.`);
        // Clear input and focus.
        newTableInput.value = '';
        newTableInput.focus();
        return true;
    }

    // DELETE A TABLE
    function deleteTable(id) {
        // Don't allow deleting the last table.
        if (data.tables.length <= 1) {
            showToast('Cannot delete the last table.');
            return;
        }
        // Find the table.
        const table = data.tables.find(t => t.id === id);
        if (!table) return;
        // Ask for confirmation.
        if (!confirm(`Delete table "${table.name}" and all its items?`)) return;
        // Remove the table from the array.
        data.tables = data.tables.filter(t => t.id !== id);
        // If we deleted the active table, switch to the first one.
        if (data.activeId === id) {
            data.activeId = data.tables.length > 0 ? data.tables[0].id : null;
        }
        // Save and redraw.
        saveData();
        renderAll();
        // Log and notify.
        logAction('Delete Table', `Table "${table.name}" deleted (${table.items.length} items removed)`);
        showToast(`Table "${table.name}" deleted.`);
    }

    // SWITCH BETWEEN TABLES
    function switchTable(id) {
        // Ignore if same or invalid.
        if (data.activeId === id || !data.tables.some(t => t.id === id)) return;
        // Get names for logging.
        const oldName = data.tables.find(t => t.id === data.activeId)?.name || 'unknown';
        const newName = data.tables.find(t => t.id === id)?.name || 'unknown';
        // Set new active.
        data.activeId = id;
        saveData();
        renderAll();
        logAction('Switch Table', `From "${oldName}" to "${newName}"`);
    }

    // ADD ITEM TO THE ACTIVE TABLE
    // Handles exact matches (increase quantity) and similar names (suggest).
    function addItemToActive(name, qty) {
        const active = getActiveTable();
        if (!active) {
            showToast('Please create a table first.');
            return false;
        }
        const trimmed = name.trim();
        // Validate.
        if (!trimmed) {
            showToast('Please enter an item name.');
            itemNameInput.focus();
            return false;
        }
        if (trimmed.length > 80) {
            showToast('Item name must be 80 characters or fewer.');
            return false;
        }
        // Convert quantity to a number, keep between 1 and 100000.
        const parsedQty = parseInt(qty, 10);
        const quantity = Math.min(100000, Math.max(1, Number.isFinite(parsedQty) ? parsedQty : 1));
        // CHECK 1: EXACT MATCH 
        // findIndex returns the position of the first matching item, or -1 if none.
        const exactIndex = active.items.findIndex(it => it.name.toLowerCase() === trimmed.toLowerCase());
        if (exactIndex !== -1) {
            // Increase the quantity of the existing item.
            const oldQty = active.items[exactIndex].quantity;
            const newQty = oldQty + quantity;
            active.items[exactIndex].quantity = newQty;
            saveData();
            renderItems();
            logAction('Increment Item (exact match)', `"${trimmed}" increased by ${quantity} → new total: ${newQty} (was ${oldQty})`);
            // Clear inputs and show message.
            itemNameInput.value = '';
            itemQtyInput.value = '1';
            itemNameInput.focus();
            showToast(`Increased "${trimmed}" by ${quantity} → new total: ${newQty}`);
            return true;
        }
        // CHECK 2: SIMILAR MATCH
        const similar = findSimilarItem(trimmed, active.items);
        if (similar) {
            // Ask the user whether they meant the similar item.
            const msg = `Did you mean "${similar.name}" (quantity ${similar.quantity})? Click OK to add to that item, Cancel to add as new.`;
            if (confirm(msg)) {
                // Add to the similar item.
                const oldQty = similar.quantity;
                const newQty = oldQty + quantity;
                similar.quantity = newQty;
                saveData();
                renderItems();
                logAction('Increment Item (from suggestion)', `"${trimmed}" added to "${similar.name}" → new total: ${newQty} (was ${oldQty})`);
                itemNameInput.value = '';
                itemQtyInput.value = '1';
                itemNameInput.focus();
                showToast(`Added "${trimmed}" to "${similar.name}" → new total: ${newQty}`);
                return true;
            }
            // If Cancel, fall through and add as new.
        }

        // CHECK 3: ADD AS NEW ITEM
        active.items.push({ name: trimmed, quantity: quantity });
        saveData();
        renderItems();
        logAction('Add Item', `"${trimmed}" (${quantity}) added to table "${active.name}"`);
        itemNameInput.value = '';
        itemQtyInput.value = '1';
        itemNameInput.focus();
        showToast(`Added "${trimmed}" (${quantity})`);
        return true;
    }

    // REMOVE A SINGLE ITEM
    function removeItemFromActive(index) {
        const active = getActiveTable();
        if (!active) return;
        if (index < 0 || index >= active.items.length) return; // Invalid index
        // Remove the item from the array.
        const removed = active.items[index];
        active.items.splice(index, 1); // splice removes 1 item at 'index'
        saveData();
        renderItems();
        logAction('Remove Item', `"${removed.name}" (${removed.quantity}) removed from table "${active.name}"`);
        showToast(`Removed "${removed.name}"`);
    }

    // CLEAR ALL ITEMS IN THE ACTIVE TABLE
    function clearActiveItems() {
        const active = getActiveTable();
        if (!active) {
            showToast('No active table.');
            return;
        }
        if (active.items.length === 0) {
            showToast('Table is already empty.');
            return;
        }
        if (!confirm(`Remove all items from "${active.name}"?`)) return;
        const count = active.items.length;
        active.items = []; // Empty the array
        saveData();
        renderItems();
        logAction('Clear Items', `All ${count} items cleared from table "${active.name}"`);
        showToast(`All items cleared from "${active.name}"`);
    }

    // GENERATE REPORT
    // Builds a table for each dashboard table, showing items + subtotal.
    function generateReport() {
        if (data.tables.length === 0) {
            showToast('No tables to report.');
            return;
        }
        // Clear the report container.
        while (reportContent.firstChild) reportContent.removeChild(reportContent.firstChild);
        let grandTotal = 0; // Sum of ALL items
        // For each table
        data.tables.forEach(table => {
            // Table title.
            const title = document.createElement('div');
            title.className = 'report-section-title';
            title.textContent = '📌 ' + table.name;
            reportContent.appendChild(title);
            // If empty, show "(no items)".
            if (table.items.length === 0) {
                const note = document.createElement('div');
                note.className = 'report-empty-note';
                note.textContent = '(no items)';
                reportContent.appendChild(note);
                return; // Skip to next table
            }
            // Create the report table.
            const tableEl = document.createElement('table');
            tableEl.className = 'report-table';
            // Header row.
            const thead = document.createElement('thead');
            const headRow = document.createElement('tr');
            const th1 = document.createElement('th');
            th1.textContent = 'Item';
            const th2 = document.createElement('th');
            th2.textContent = 'Quantity';
            th2.className = 'text-center';
            headRow.appendChild(th1);
            headRow.appendChild(th2);
            thead.appendChild(headRow);
            tableEl.appendChild(thead);
            // Body: one row per item.
            const tbody = document.createElement('tbody');
            let subTotal = 0;
            table.items.forEach(item => {
                const qty = Number(item.quantity) || 0;
                subTotal += qty;
                const tr = document.createElement('tr');
                const tdName = document.createElement('td');
                tdName.textContent = item.name || 'Unnamed';
                const tdQty = document.createElement('td');
                tdQty.textContent = qty;
                tdQty.className = 'text-center';
                tr.appendChild(tdName);
                tr.appendChild(tdQty);
                tbody.appendChild(tr);
            });
            // Subtotal row.
            const subRow = document.createElement('tr');
            subRow.className = 'subtotal-row';
            const subLabel = document.createElement('td');
            subLabel.textContent = 'Subtotal';
            subLabel.className = 'text-right';
            const subVal = document.createElement('td');
            subVal.textContent = subTotal;
            subVal.className = 'text-center';
            subRow.appendChild(subLabel);
            subRow.appendChild(subVal);
            tbody.appendChild(subRow);
            tableEl.appendChild(tbody);
            // Add the table to the report.
            reportContent.appendChild(tableEl);
            grandTotal += subTotal; // Add to overall total
        });
        // Grand total at the bottom.
        const grandDiv = document.createElement('div');
        grandDiv.className = 'report-grand-total';
        const grandLabel = document.createElement('span');
        grandLabel.textContent = '🏆 Grand Total';
        const grandVal = document.createElement('span');
        grandVal.textContent = grandTotal;
        grandDiv.appendChild(grandLabel);
        grandDiv.appendChild(grandVal);
        reportContent.appendChild(grandDiv);
        // Show the modal.
        reportModal.classList.add('open');
    }

    // RENDER AUDIT LOG
    function renderAuditLog() {
        // Clear the log container.
        while (auditContent.firstChild) auditContent.removeChild(auditContent.firstChild);
        // If empty, show a message.
        if (data.auditLog.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'report-empty';
            empty.textContent = 'No actions logged yet.';
            auditContent.appendChild(empty);
            return;
        }
        // ba Reverse the log fa el newest entries show first.
        const reversed = [...data.auditLog].reverse();
        reversed.forEach(entry => {
            // Convert ISO timestamp to a readable string.
            const time = new Date(entry.timestamp).toLocaleString();
            // Create a row for this entry.
            const row = document.createElement('div');
            row.className = 'audit-entry';
            row.appendChild(spanWith('audit-time', time));
            row.appendChild(spanWith('audit-user', entry.user));
            row.appendChild(spanWith('audit-action', entry.action));
            row.appendChild(spanWith('audit-details', entry.details));
            auditContent.appendChild(row);
        });
    }

    // TOAST (the small black message at the bottom)
    let toastTimer = null;
    function showToast(msg) {
        toast.textContent = msg;          // Set the text
        toast.classList.add('show');      // Show it with CSS class
        // Clear previous timer to avoid overlap.
        clearTimeout(toastTimer);
        // Hide after 3 seconds.
        toastTimer = setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    // EVENT LISTENERS (the app)
    // Create table on button click.
    createTableBtn.addEventListener('click', () => createTable(newTableInput.value));
    // Press Enter in the table input = create table.
    newTableInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); createTable(newTableInput.value); }
    });
    // Add item on button click.
    addBtn.addEventListener('click', () => addItemToActive(itemNameInput.value, itemQtyInput.value));
    // Press Enter in item name = add item.
    itemNameInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); addItemToActive(itemNameInput.value, itemQtyInput.value); }
    });
    // Press Enter in item quantity = add item.
    itemQtyInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); addItemToActive(itemNameInput.value, itemQtyInput.value); }
    });
    // Clear current table's items.
    clearBtn.addEventListener('click', clearActiveItems);
    // Report button.
    reportBtn.addEventListener('click', generateReport);
    closeReportBtn.addEventListener('click', () => reportModal.classList.remove('open'));
    reportModal.addEventListener('click', (e) => {
        // Click outside the modal box = close.
        if (e.target === reportModal) reportModal.classList.remove('open');
    });
    // Audit log button.
    auditLogBtn.addEventListener('click', () => {
        renderAuditLog();
        auditModal.classList.add('open');
    });
    closeAuditBtn.addEventListener('click', () => auditModal.classList.remove('open'));
    auditModal.addEventListener('click', (e) => {
        if (e.target === auditModal) auditModal.classList.remove('open');
    });
    // Clear log button.
    clearAuditBtn.addEventListener('click', () => {
        if (data.auditLog.length === 0) {
            showToast('Audit log is already empty.');
            return;
        }
        if (confirm('Delete all audit log entries?')) {
            data.auditLog = [];
            saveData();
            renderAuditLog();
            showToast('Audit log cleared.');
        }
    });
    // Global ESC key closes any open modal.
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (reportModal.classList.contains('open')) reportModal.classList.remove('open');
            if (auditModal.classList.contains('open')) auditModal.classList.remove('open');
        }
    });

    // HANDLE URL HASH
    // The hash after # could be:
    //   1. A 6-character room code (e.g. #ABC123)
    //   2. A compressed share link (very long)
    function handleHash() {
        const hash = window.location.hash;
        if (!hash) return;
        // Remove the "#" from the start.
        const value = hash.substring(1);
        // CASE 1: SHORT ROOM CODE 
        if (value.length === 6 && /^[A-Z0-9]{6}$/.test(value)) {
            if (roomExists(value)) {
                enterRoom(value);
            } else {
                dashboardError.textContent = 'Dashboard not found. Please create it first.';
            }
            return;
        }
        //  CASE 2: COMPRESSED SHARE LINK 
        try {
            // Try to decompress the string.
            // fa el json el compressed ye7awel l string normal.
            const json = LZString.decompressFromEncodedURIComponent(value);
            if (json) {
                const payload = JSON.parse(json);
                // Validate payload.
                if (payload.room && payload.data) {
                    // Save the room data to localStorage.
                    saveRoomData(payload.room, payload.data);
                    // Now enter the room.
                    if (roomExists(payload.room)) {
                        enterRoom(payload.room);
                        showToast('✅ Shared dashboard loaded!');
                        return;
                    }
                }
            }
        } catch (e) {
            console.warn('Failed to load shared link:', e);
        }

        // Nothing worked — show an error.
        dashboardError.textContent = 'Invalid link. Please use a valid dashboard code or shared link.';
    }

    // Run handleHash whenever the URL hash changes.
    window.addEventListener('hashchange', handleHash);

    // INIT (start the app)
    if (window.location.hash) {
        // If there's a # in the URL, try to load that room.
        // A small delay lets LZString library finish loading.
        setTimeout(handleHash, 100);
    } else {
        // Otherwise, show the dashboard selection screen.
        dashboardOverlay.style.display = 'flex';
        appContainer.style.display = 'none';
    }
})();