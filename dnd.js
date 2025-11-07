// ============================================================================
// DND.HTML - CHARACTER SHEET SCRIPT
// ============================================================================

let remainingPoints = 10;

// Default attributes (will be overwritten by class)
let attributes = {
    str: 10,
    dex: 10,
    con: 10,
    int: 10,
    wis: 10,
    cha: 10
};

// Class-specific starting stats (D&D 5e standard array distributed)
const classStartingStats = {
    'Warrior': {
        str: 15,  // Primary - melee combat
        dex: 13,  // Secondary - AC
        con: 14,  // Secondary - HP
        int: 8,   // Dump stat
        wis: 12,  // Decent - Perception
        cha: 10   // Average
    },
    'Rogue': {
        str: 10,  // Average
        dex: 15,  // Primary - attacks, AC, stealth
        con: 12,  // Decent - HP
        int: 13,  // Good - Investigation
        wis: 14,  // Secondary - Perception
        cha: 8    // Dump stat
    },
    'Mage': {
        str: 8,   // Dump stat
        dex: 14,  // Secondary - AC
        con: 13,  // Decent - HP/Concentration
        int: 15,  // Primary - spellcasting
        wis: 12,  // Decent - Saves
        cha: 10   // Average
    },
    'Cleric': {
        str: 13,  // Decent - melee option
        dex: 10,  // Average
        con: 14,  // Secondary - HP
        int: 8,   // Dump stat
        wis: 15,  // Primary - spellcasting
        cha: 12   // Decent - social
    }
};

// Race-specific stat bonuses (D&D 5e racial bonuses)
const raceStatBonuses = {
    'Human': {
        str: 1,
        dex: 1,
        con: 1,
        int: 1,
        wis: 1,
        cha: 1
    },
    'Elf': {
        str: 0,
        dex: 2,  // Nimble and graceful
        con: 0,
        int: 1,  // Keen mind
        wis: 0,
        cha: 0
    },
    'Dwarf': {
        str: 0,
        dex: 0,
        con: 2,  // Hardy and resilient
        int: 0,
        wis: 1,  // Wise and traditional
        cha: 0
    },
    'Halfling': {
        str: 0,
        dex: 2,  // Small and quick
        con: 0,
        int: 0,
        wis: 0,
        cha: 1   // Friendly and likeable
    }
};

// Apply race bonuses to base stats
function applyRaceBonuses(baseStats, race) {
    const bonuses = raceStatBonuses[race];
    if (!bonuses) return baseStats;
    
    const finalStats = {};
    for (let attr in baseStats) {
        finalStats[attr] = baseStats[attr] + (bonuses[attr] || 0);
    }
    return finalStats;
}

// HP and MP system
let currentHP = 100;
let maxHP = 100;
let currentMP = 50;
let maxMP = 50;

// Starting equipment by class (D&D 5e based)
// Each class starts with 3 items out of 50 inventory slots (3/50)
// Image files should be 128x128 pixels (or 256x256 for retina displays)
// Supported formats: PNG, JPG, WEBP, GIF
const classStartingItems = {
    'Warrior': [
        { name: 'Longsword', image: 'longsword.png', description: 'Martial weapon (1d8 slashing)' },
        { name: 'Shield', image: 'shield.png', description: 'Heavy shield (+2 AC)' },
        { name: 'Health Potion', image: 'health_potion.png', description: 'Restores 2d4+2 HP' }
    ],
    'Rogue': [
        { name: 'Dagger', image: 'dagger.png', description: 'Light weapon (1d4 piercing)' },
        { name: 'Thieves Tools', image: 'thieves_tools.png', description: 'For lockpicking and traps' },
        { name: 'Leather Armor', image: 'leather_armor.png', description: 'Light armor (AC 11 + DEX)' }
    ],
    'Mage': [
        { name: 'Spellbook', image: 'spellbook.png', description: 'Contains 6 level 1 spells' },
        { name: 'Arcane Focus', image: 'arcane_focus.png', description: 'Crystal orb for spellcasting' },
        { name: 'Mana Potion', image: 'mana_potion.png', description: 'Restores 2d4+2 MP' }
    ],
    'Cleric': [
        { name: 'Mace', image: 'mace.png', description: 'Simple weapon (1d6 bludgeoning)' },
        { name: 'Holy Symbol', image: 'holy_symbol.png', description: 'Divine spellcasting focus' },
        { name: 'Healing Scroll', image: 'healing_scroll.png', description: 'Cure Wounds spell scroll' }
    ]
};

// Default to Warrior items if class not found
let inventoryItems = classStartingItems['Warrior'];

// D&D Traits/Feats based on ability scores
const traitsByAttribute = {
    str: [
        { name: 'Powerful Build', minStat: 14, description: 'You count as one size larger for carrying capacity and push/pull/lift' },
        { name: 'Heavy Weapon Master', minStat: 16, description: '+3 damage with heavy melee weapons' },
        { name: 'Grappler', minStat: 18, description: 'Advantage on grapple checks and improved pin' },
        { name: 'Savage Attacker', minStat: 20, description: 'Reroll melee weapon damage once per turn' }
    ],
    dex: [
        { name: 'Acrobat', minStat: 14, description: 'You have advantage on Acrobatics checks' },
        { name: 'Mobile', minStat: 16, description: '+10 movement speed and avoid opportunity attacks' },
        { name: 'Sharpshooter', minStat: 18, description: 'Ignore cover and +5 damage with ranged weapons' },
        { name: 'Alert', minStat: 20, description: '+5 initiative and cannot be surprised' }
    ],
    con: [
        { name: 'Resilient', minStat: 14, description: 'Advantage on death saving throws' },
        { name: 'Durable', minStat: 16, description: 'Regain +2 HP when healing' },
        { name: 'Tough', minStat: 18, description: 'Gain +2 HP per level' },
        { name: 'Relentless', minStat: 20, description: 'Once per day, drop to 1 HP instead of 0' }
    ],
    int: [
        { name: 'Keen Mind', minStat: 14, description: '+1 INT and excellent memory' },
        { name: 'Ritual Caster', minStat: 16, description: 'Cast 2 ritual spells' },
        { name: 'War Caster', minStat: 18, description: 'Advantage on concentration saves' },
        { name: 'Arcane Scholar', minStat: 20, description: 'Learn one additional spell of any level' }
    ],
    wis: [
        { name: 'Observant', minStat: 14, description: '+5 passive Perception and Investigation' },
        { name: 'Healer', minStat: 16, description: 'Heal +4 HP when using healing spells' },
        { name: 'Perceptive', minStat: 18, description: 'Cannot be surprised and see invisible creatures' },
        { name: 'Mystic Insight', minStat: 20, description: 'Detect magic at will' }
    ],
    cha: [
        { name: 'Inspiring Leader', minStat: 14, description: 'Grant temp HP to allies with inspiring speech' },
        { name: 'Actor', minStat: 16, description: 'Advantage on Deception and Performance' },
        { name: 'Silver Tongue', minStat: 18, description: 'Reroll failed Persuasion checks' },
        { name: 'Lucky', minStat: 20, description: 'Three luck points to reroll any d20' }
    ]
};

// Selected traits storage
let selectedTraits = [];

function calculateMaxHP() {
    // Base HP calculation: base 20 + (CON * 2) as a simple rule of thumb.
    // Keeps numbers reasonable for the battle system in dnd-battle.js.
    try {
        const con = (attributes && typeof attributes.con !== 'undefined') ? Number(attributes.con) : 10;
        const base = 20 + (con * 2);
        return Math.max(10, base);
    } catch (e) {
        return 30;
    }
}
// The battle system was moved to `dnd-battle.js` to avoid duplicate definitions.
// This file keeps `initializeAll` and other character-sheet logic. The
// battle implementation (startBattle, enemy AI, loot generation) now lives
// in `dnd-battle.js` which provides the same global functions the UI calls.
// Adds an item to the inventory and refreshes the UI (persists to active character)
function addItemToInventory(item) {
    if (!item) return;
    // Basic item shape: { name, image, description }
    inventoryItems.push(item);

    // Persist to active character data in localStorage (so loot survives reload)
    try {
        const raw = localStorage.getItem('characterData');
        if (raw) {
            const c = JSON.parse(raw);
            c.inventory = inventoryItems;
            localStorage.setItem('characterData', JSON.stringify(c));
        }
    } catch (e) {
        console.warn('Failed to persist inventory to characterData:', e);
    }

    // Re-render inventory
    createInventorySlots();

    // Show a small toast to inform the player
    showLootToast([item]);
}

// Equip an item by index in inventory (marks equipped and persists)
function equipItemAtIndex(index) {
    if (index < 0 || index >= inventoryItems.length) return;
    inventoryItems[index].equipped = true;
    // persist
    try {
        const raw = localStorage.getItem('characterData');
        if (raw) {
            const c = JSON.parse(raw);
            c.inventory = inventoryItems;
            localStorage.setItem('characterData', JSON.stringify(c));
        }
    } catch (e) {
        console.warn('Failed to persist equipped state:', e);
    }
    createInventorySlots();
}

// Show a transient loot toast for newly acquired items
function showLootToast(items) {
    if (!items || items.length === 0) return;
    const toast = document.createElement('div');
    toast.style.position = 'fixed';
    toast.style.right = '20px';
    toast.style.bottom = '20px';
    toast.style.zIndex = 5000;
    toast.style.background = 'linear-gradient(135deg,#1a1410,#2b1f17)';
    toast.style.border = '2px solid #8b5a2b';
    toast.style.color = '#e8d5b7';
    toast.style.padding = '12px 16px';
    toast.style.borderRadius = '10px';
    toast.style.boxShadow = '0 8px 30px rgba(0,0,0,0.6)';
    toast.style.fontFamily = 'MedievalSharp, cursive';
    toast.innerHTML = '<strong>Loot Acquired:</strong><br>' + items.map(i => `• ${i.name}`).join('<br>');

    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.transition = 'opacity 0.4s ease';
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 450);
    }, 2500);
}

// Show a modal listing loot items (used after battle)
// Temporary storage for loot until player takes/drops
let currentLootTemp = [];

function showLootModal(items) {
    if (!items || items.length === 0) return;
    currentLootTemp = items.slice();
    const modal = document.getElementById('lootModal');
    const list = document.getElementById('lootList');
    const desc = document.getElementById('lootModalDescription');
    if (!modal || !list) return;

    list.innerHTML = '';

    // Header actions
    const actionsRow = document.createElement('div');
    actionsRow.style.display = 'flex';
    actionsRow.style.justifyContent = 'center';
    actionsRow.style.gap = '8px';
    actionsRow.style.marginBottom = '8px';

    const takeAllBtn = document.createElement('button');
    takeAllBtn.className = 'trait-select-btn';
    takeAllBtn.textContent = 'Take All';
    takeAllBtn.onclick = () => {
        currentLootTemp.forEach(it => addItemToInventory(it));
        currentLootTemp = [];
        closeLootModal();
    };

    const equipAllBtn = document.createElement('button');
    equipAllBtn.className = 'trait-select-btn';
    equipAllBtn.textContent = 'Take & Equip All';
    equipAllBtn.onclick = () => {
        currentLootTemp.forEach(it => {
            addItemToInventory(it);
            // attempt to equip newly added item (last index)
            equipItemAtIndex(inventoryItems.length - 1);
        });
        currentLootTemp = [];
        closeLootModal();
    };

    const dropAllBtn = document.createElement('button');
    dropAllBtn.className = 'trait-select-btn';
    dropAllBtn.textContent = 'Drop All';
    dropAllBtn.onclick = () => {
        currentLootTemp = [];
        closeLootModal();
    };

    actionsRow.appendChild(takeAllBtn);
    actionsRow.appendChild(equipAllBtn);
    actionsRow.appendChild(dropAllBtn);
    list.appendChild(actionsRow);

    // Individual items
    items.forEach((item, idx) => {
        const row = document.createElement('div');
        row.style.display = 'flex';
        row.style.gap = '12px';
        row.style.alignItems = 'center';
        row.style.padding = '8px';
        row.style.border = '1px solid rgba(139,90,43,0.12)';
        row.style.borderRadius = '8px';
        row.style.background = 'linear-gradient(135deg, rgba(13,9,6,0.2), rgba(26,20,16,0.2))';

        const img = document.createElement('div');
        img.style.width = '56px';
        img.style.height = '56px';
        img.style.borderRadius = '6px';
        img.style.background = '#0d0906';
        img.style.display = 'flex';
        img.style.alignItems = 'center';
        img.style.justifyContent = 'center';
        img.style.fontSize = '28px';
        if (item.image) {
            const i = document.createElement('img');
            i.src = item.image;
            i.alt = item.name;
            i.style.maxWidth = '100%';
            i.style.maxHeight = '100%';
            i.onerror = function() { img.textContent = '❌'; i.style.display = 'none'; };
            img.appendChild(i);
        } else { img.textContent = '🎁'; }

        const meta = document.createElement('div');
        meta.style.display = 'flex';
        meta.style.flexDirection = 'column';
        meta.style.justifyContent = 'center';
        meta.style.flex = '1';

        const title = document.createElement('div');
        title.textContent = item.name || 'Unknown Item';
        title.style.color = '#ffd700';
        title.style.fontWeight = 'bold';

        const info = document.createElement('div');
        info.textContent = item.description || '';
        info.style.color = '#a0826d';
        info.style.fontSize = '0.95em';

        const controls = document.createElement('div');
        controls.style.display = 'flex';
        controls.style.gap = '6px';

        const takeBtn = document.createElement('button');
        takeBtn.className = 'trait-select-btn';
        takeBtn.textContent = 'Take';
        takeBtn.onclick = () => {
            addItemToInventory(item);
            // remove from temp
            currentLootTemp = currentLootTemp.filter((_, i) => i !== idx);
            row.remove();
        };

        const equipBtn = document.createElement('button');
        equipBtn.className = 'trait-select-btn';
        equipBtn.textContent = 'Take & Equip';
        equipBtn.onclick = () => {
            addItemToInventory(item);
            equipItemAtIndex(inventoryItems.length - 1);
            currentLootTemp = currentLootTemp.filter((_, i) => i !== idx);
            row.remove();
        };

        const dropBtn = document.createElement('button');
        dropBtn.className = 'trait-select-btn';
        dropBtn.textContent = 'Drop';
        dropBtn.onclick = () => {
            currentLootTemp = currentLootTemp.filter((_, i) => i !== idx);
            row.remove();
        };

        controls.appendChild(takeBtn);
        controls.appendChild(equipBtn);
        controls.appendChild(dropBtn);

        meta.appendChild(title);
        meta.appendChild(info);

        row.appendChild(img);
        row.appendChild(meta);
        row.appendChild(controls);

        list.appendChild(row);
    });

    if (desc) desc.textContent = `You found ${items.length} item${items.length>1? 's' : ''}:`;
    modal.style.display = 'flex';
}

function closeLootModal() {
    const modal = document.getElementById('lootModal');
    if (modal) modal.style.display = 'none';
}

// ------------------------------
// Bag modal / using items (supports using Mana Potions in-battle)
// ------------------------------
function showBagModal() {
    const modal = document.getElementById('bagModal');
    const list = document.getElementById('bagList');
    if (!modal || !list) return;
    list.innerHTML = '';

    if (!inventoryItems || inventoryItems.length === 0) {
        list.innerHTML = '<p style="color:#a0826d; text-align:center;">Your bag is empty.</p>';
        modal.style.display = 'flex';
        return;
    }

    inventoryItems.forEach((item, idx) => {
        const row = document.createElement('div');
        row.style.display = 'flex';
        row.style.justifyContent = 'space-between';
        row.style.alignItems = 'center';
        row.style.padding = '8px';
        row.style.border = '1px solid rgba(139,90,43,0.08)';
        row.style.borderRadius = '8px';

        const left = document.createElement('div');
        left.style.display = 'flex';
        left.style.gap = '8px';
        left.style.alignItems = 'center';

        const icon = document.createElement('div');
        icon.style.width = '48px';
        icon.style.height = '48px';
        icon.style.borderRadius = '6px';
        icon.style.background = '#0d0906';
        icon.style.display = 'flex';
        icon.style.alignItems = 'center';
        icon.style.justifyContent = 'center';
        if (item.image) {
            const img = document.createElement('img');
            img.src = item.image;
            img.alt = item.name;
            img.style.maxWidth = '100%';
            img.style.maxHeight = '100%';
            icon.appendChild(img);
        } else {
            icon.textContent = '🎲';
        }

        const meta = document.createElement('div');
        meta.style.display = 'flex';
        meta.style.flexDirection = 'column';
        meta.style.justifyContent = 'center';
        meta.style.flex = '1';

        const title = document.createElement('div');
        title.textContent = item.name || 'Item';
        title.style.color = '#ffd700';
        title.style.fontWeight = 'bold';

        const desc = document.createElement('div');
        desc.textContent = item.description || '';
        desc.style.color = '#a0826d';
        desc.style.fontSize = '0.95em';

        meta.appendChild(title);
        meta.appendChild(desc);

        left.appendChild(icon);
        left.appendChild(meta);

        const controls = document.createElement('div');
        controls.style.display = 'flex';
        controls.style.gap = '8px';

        const useBtn = document.createElement('button');
        useBtn.className = 'trait-select-btn';
        useBtn.textContent = 'Use';
        useBtn.onclick = function() { useItemFromBag(idx); };

        const equipBtn = document.createElement('button');
        equipBtn.className = 'trait-select-btn';
        equipBtn.textContent = (item && item.equipped) ? 'Unequip' : 'Equip';
        equipBtn.onclick = function() {
            if (!inventoryItems[idx]) return;
            inventoryItems[idx].equipped = !inventoryItems[idx].equipped;
            try { const raw = localStorage.getItem('characterData'); if (raw) { const c = JSON.parse(raw); c.inventory = inventoryItems; localStorage.setItem('characterData', JSON.stringify(c)); } } catch (e) { console.warn(e); }
            createInventorySlots();
            showBagModal();
        };

        const dropBtn = document.createElement('button');
        dropBtn.className = 'trait-select-btn';
        dropBtn.textContent = 'Drop';
        dropBtn.style.background = 'linear-gradient(135deg,#3d2412,#5c3a1e)';
        dropBtn.onclick = function() {
            if (!inventoryItems[idx]) return;
            inventoryItems.splice(idx, 1);
            try { const raw = localStorage.getItem('characterData'); if (raw) { const c = JSON.parse(raw); c.inventory = inventoryItems; localStorage.setItem('characterData', JSON.stringify(c)); } } catch (e) { console.warn(e); }
            createInventorySlots();
            showBagModal();
        };

        controls.appendChild(useBtn);
        controls.appendChild(equipBtn);
        controls.appendChild(dropBtn);

        row.appendChild(left);
        row.appendChild(controls);
        list.appendChild(row);
    });

    modal.style.display = 'flex';
}

function closeBagModal() {
    const modal = document.getElementById('bagModal');
    if (modal) modal.style.display = 'none';
}

function useItemFromBag(index) {
    if (!inventoryItems || !inventoryItems[index]) return;
    const item = inventoryItems[index];

    // Mana potions
    if (item.name && item.name.toLowerCase().includes('mana')) {
        // Default effect: 2d4+2 MP (matches item description in starting items)
        const amount = rollDice({count:2, sides:4, bonus:2});
        if (window.battleState && battleState.turn === 'player') {
            battleState.player.mp = Math.min(battleState.player.maxMp, (battleState.player.mp || 0) + amount);
            setBattleMessage(`Used ${item.name}, restored ${amount} MP!`);
            renderBattleUI();
            // Remove item from inventory
            inventoryItems.splice(index,1);
            try { const raw = localStorage.getItem('characterData'); if (raw) { const c = JSON.parse(raw); c.inventory = inventoryItems; localStorage.setItem('characterData', JSON.stringify(c)); } } catch(e){console.warn(e);}            
            createInventorySlots();
            closeBagModal();
            // Using an item consumes your turn
            battleState.turn = 'enemy';
            setTimeout(() => enemyTurn(), 700);
            return;
        } else {
            // Out of battle: adjust global MP
            currentMP = Math.min(maxMP, currentMP + amount);
            updateMPBar();
            showLootToast([{name: item.name}]);
            inventoryItems.splice(index,1);
            try { const raw = localStorage.getItem('characterData'); if (raw) { const c = JSON.parse(raw); c.inventory = inventoryItems; localStorage.setItem('characterData', JSON.stringify(c)); } } catch(e){console.warn(e);}            
            createInventorySlots();
            closeBagModal();
            return;
        }
    }

    // Health potions or other consumables could be handled here
    alert('This item cannot be used from the bag in the current implementation.');
}

// Create inventory slots (renders the inventory grid)
function createInventorySlots() {
    const inventoryGrid = document.getElementById('inventoryGrid');
    if (!inventoryGrid) return;

    inventoryGrid.innerHTML = '';
    
    // Create 50 slots (5 rows x 10 columns)
    const maxSlots = 50;
    for (let i = 0; i < maxSlots; i++) {
        const slot = document.createElement('div');
        slot.className = 'inventory-slot';
        
        // If there's an item in this slot
        if (i < inventoryItems.length && inventoryItems[i]) {
            const item = inventoryItems[i];
            slot.classList.add('filled');
            
            // Create image element
            if (item.image) {
                const img = document.createElement('img');
                img.src = item.image;
                img.alt = item.name || 'Item';
                img.onerror = function() {
                    // If image fails to load, show emoji fallback
                    this.style.display = 'none';
                    slot.textContent = '📦';
                };
                slot.appendChild(img);
            } else {
                // No image, show emoji
                slot.textContent = '📦';
            }
            
            // Add equipped indicator
            if (item.equipped) {
                const equippedBadge = document.createElement('div');
                equippedBadge.textContent = '✓';
                equippedBadge.style.position = 'absolute';
                equippedBadge.style.top = '2px';
                equippedBadge.style.right = '2px';
                equippedBadge.style.fontSize = '10px';
                equippedBadge.style.color = '#00ff00';
                equippedBadge.style.textShadow = '0 0 5px #00ff00';
                slot.style.position = 'relative';
                slot.appendChild(equippedBadge);
            }
            
            // Create tooltip
            const tooltip = document.createElement('div');
            tooltip.className = 'tooltip';
            tooltip.innerHTML = `<strong>${item.name || 'Item'}</strong><br>${item.description || ''}`;
            slot.appendChild(tooltip);
            
            // Setup hold-click functionality
            setupItemHoldClick(slot, item, i);
        } else {
            // Empty slot
            slot.textContent = '';
        }
        
        inventoryGrid.appendChild(slot);
    }
}

// Hold-click functionality for items
let holdTimer = null;
let isHolding = false;

function setupItemHoldClick(slotElement, item, index) {
    // Mouse events (desktop)
    slotElement.addEventListener('mousedown', function(e) {
        e.preventDefault();
        isHolding = true;
        holdTimer = setTimeout(() => {
            if (isHolding) {
                showItemModal(item, index);
            }
        }, 500); // Hold for 500ms
    });
    
    slotElement.addEventListener('mouseup', cancelHold);
    slotElement.addEventListener('mouseleave', cancelHold);
    
    // Touch events (mobile)
    slotElement.addEventListener('touchstart', function(e) {
        e.preventDefault();
        isHolding = true;
        holdTimer = setTimeout(() => {
            if (isHolding) {
                showItemModal(item, index);
            }
        }, 500); // Hold for 500ms
    });
    
    slotElement.addEventListener('touchend', cancelHold);
    slotElement.addEventListener('touchcancel', cancelHold);
}

function cancelHold() {
    isHolding = false;
    if (holdTimer) {
        clearTimeout(holdTimer);
        holdTimer = null;
    }
}

function showItemModal(item, index) {
    const modal = document.getElementById('itemModal');
    const modalImage = document.querySelector('#itemModalImage img');
    const modalName = document.getElementById('itemModalName');
    const modalDescription = document.getElementById('itemModalDescription');
    
    if (modal && modalImage && modalName && modalDescription) {
        modalImage.src = item.image || '';
        modalImage.alt = item.name || '';
        modalName.textContent = item.name || 'Item';
        modalDescription.textContent = item.description || '';

        // Remove any previous action row
        const existingRow = modal.querySelector('.item-action-row');
        if (existingRow) existingRow.remove();

        // If index provided (item is in inventory), show action buttons
        const content = modal.querySelector('.trait-modal-content');
        if (typeof index === 'number' && content) {
            const actionRow = document.createElement('div');
            actionRow.className = 'item-action-row';
            actionRow.style.display = 'flex';
            actionRow.style.gap = '8px';
            actionRow.style.justifyContent = 'center';
            actionRow.style.marginTop = '12px';

            const equipBtn = document.createElement('button');
            equipBtn.className = 'trait-select-btn';
            equipBtn.textContent = (inventoryItems[index] && inventoryItems[index].equipped) ? 'Unequip' : 'Equip';
            equipBtn.onclick = function() {
                // toggle equip
                if (!inventoryItems[index]) return;
                if (inventoryItems[index].equipped) {
                    inventoryItems[index].equipped = false;
                } else {
                    // unequip any other items (if single-equip desired, optional)
                    // For now allow multiple equips; to force single-equip uncomment below
                    // inventoryItems.forEach(it => it.equipped = false);
                    inventoryItems[index].equipped = true;
                }
                // persist
                try {
                    const raw = localStorage.getItem('characterData');
                    if (raw) {
                        const c = JSON.parse(raw);
                        c.inventory = inventoryItems;
                        localStorage.setItem('characterData', JSON.stringify(c));
                    }
                } catch (e) { console.warn('Failed to persist equip toggle', e); }
                createInventorySlots();
                // update button text
                equipBtn.textContent = inventoryItems[index] && inventoryItems[index].equipped ? 'Unequip' : 'Equip';
            };

            const dropBtn = document.createElement('button');
            dropBtn.className = 'trait-select-btn';
            dropBtn.textContent = 'Drop';
            dropBtn.style.background = 'linear-gradient(135deg,#3d2412,#5c3a1e)';
            dropBtn.onclick = function() {
                if (!inventoryItems[index]) return;
                const confirmDrop = window.confirm(`Drop ${inventoryItems[index].name || 'this item'}?`);
                if (!confirmDrop) return;
                inventoryItems.splice(index, 1);
                // persist
                try {
                    const raw = localStorage.getItem('characterData');
                    if (raw) {
                        const c = JSON.parse(raw);
                        c.inventory = inventoryItems;
                        localStorage.setItem('characterData', JSON.stringify(c));
                    }
                } catch (e) { console.warn('Failed to persist drop', e); }
                createInventorySlots();
                closeItemModal();
            };

            const closeBtn = document.createElement('button');
            closeBtn.className = 'trait-select-btn';
            closeBtn.textContent = 'Close';
            closeBtn.onclick = function() { closeItemModal(); };

            actionRow.appendChild(equipBtn);
            actionRow.appendChild(dropBtn);
            actionRow.appendChild(closeBtn);

            // append actionRow to modal content area
            content.appendChild(actionRow);
        }

        modal.style.display = 'flex';
    }
}

function closeItemModal(event) {
    const modal = document.getElementById('itemModal');
    if (modal) {
        // Close if clicking outside the modal content or on close button
        if (!event || event.target === modal) {
            modal.style.display = 'none';
        }
    }
}

// Update HP bar display
function updateHPBar() {
    const hpBar = document.getElementById('hpBar');
    const hpText = document.getElementById('hpText');
    if (hpBar) {
        const percentage = (currentHP / maxHP) * 100;
        hpBar.style.width = percentage + '%';
    }
    if (hpText) {
        hpText.textContent = `${Math.round(currentHP)} / ${maxHP}`;
    }
}

// Update MP bar display
function updateMPBar() {
    const mpBar = document.getElementById('mpBar');
    const mpText = document.getElementById('mpText');
    if (mpBar) {
        const percentage = (currentMP / maxMP) * 100;
        mpBar.style.width = percentage + '%';
    }
    if (mpText) {
        mpText.textContent = `${Math.round(currentMP)} / ${maxMP}`;
    }
}

// Update traits display
function updateTraitsDisplay() {
    const container = document.getElementById('traitsContainer');
    if (!container) return;

    if (!selectedTraits || selectedTraits.length === 0) {
        container.innerHTML = '<p style="color: #a0826d; text-align: center;">No traits selected yet</p>';
        return;
    }

    container.innerHTML = '';
    selectedTraits.forEach(trait => {
        const traitDiv = document.createElement('div');
        traitDiv.className = 'trait-item';
        traitDiv.innerHTML = `
            <div class="trait-header">
                <strong>${trait.name}</strong>
                <span class="trait-badge">${trait.source || 'Trait'}</span>
            </div>
            <p class="trait-desc">${trait.description}</p>
        `;
        container.appendChild(traitDiv);
    });
}

// Increase attribute (spend points)
function increaseAttribute(attr) {
    if (remainingPoints <= 0) {
        alert('No points remaining!');
        return;
    }

    // Increase the attribute
    attributes[attr]++;
    remainingPoints--;

    // Update displays
    const valueElement = document.getElementById(`${attr}-value`);
    if (valueElement) {
        valueElement.textContent = attributes[attr];
    }

    const pointsElement = document.getElementById('points-remaining');
    if (pointsElement) {
        pointsElement.textContent = remainingPoints;
    }

    // Recalculate HP/MP based on CON/INT changes
    if (attr === 'con') {
        maxHP = calculateMaxHP();
        currentHP = maxHP; // Heal to full when increasing CON
        updateHPBar();
    }
    if (attr === 'int') {
        maxMP = 50 + (attributes.int * 2); // 2 MP per INT point
        currentMP = maxMP; // Restore to full when increasing INT
        updateMPBar();
    }

    // Check for new traits unlocked
    checkForNewTraits(attr);

    // Save to localStorage
    try {
        const raw = localStorage.getItem('characterData');
        if (raw) {
            const c = JSON.parse(raw);
            c.attributes = attributes;
            c.remainingPoints = remainingPoints;
            c.selectedTraits = selectedTraits;
            localStorage.setItem('characterData', JSON.stringify(c));
        }
    } catch (e) {
        console.warn('Failed to persist attributes:', e);
    }
}

// Check if new traits are unlocked based on attribute changes
function checkForNewTraits(attr) {
    if (!traitsByAttribute[attr]) return;

    const availableTraits = traitsByAttribute[attr].filter(trait => {
        // Check if meets minimum stat requirement and not already selected
        return attributes[attr] >= trait.minStat && 
               !selectedTraits.find(t => t.name === trait.name);
    });

    if (availableTraits.length > 0) {
        showTraitModal(availableTraits, attr);
    }
}

// Show trait selection modal
function showTraitModal(traits, source) {
    const modal = document.getElementById('traitModal');
    const traitList = document.getElementById('traitList');
    if (!modal || !traitList) return;

    traitList.innerHTML = '';
    
    traits.forEach(trait => {
        const card = document.createElement('div');
        card.className = 'trait-card';
        card.innerHTML = `
            <h4>${trait.name}</h4>
            <p class="trait-requirement">Requires ${source.toUpperCase()} ${trait.minStat}+</p>
            <p class="trait-description">${trait.description}</p>
        `;
        
        const selectBtn = document.createElement('button');
        selectBtn.className = 'trait-select-btn';
        selectBtn.textContent = 'Select This Trait';
        selectBtn.onclick = () => selectTrait(trait, source);
        
        card.appendChild(selectBtn);
        traitList.appendChild(card);
    });

    modal.style.display = 'flex';
}

// Select a trait
function selectTrait(trait, source) {
    selectedTraits.push({
        name: trait.name,
        description: trait.description,
        source: source.toUpperCase(),
        minStat: trait.minStat
    });

    // Save to localStorage
    try {
        const raw = localStorage.getItem('characterData');
        if (raw) {
            const c = JSON.parse(raw);
            c.selectedTraits = selectedTraits;
            localStorage.setItem('characterData', JSON.stringify(c));
        }
    } catch (e) {
        console.warn('Failed to persist traits:', e);
    }

    updateTraitsDisplay();
    closeTraitModal();
}

// Close trait modal
function closeTraitModal() {
    const modal = document.getElementById('traitModal');
    if (modal) modal.style.display = 'none';
}

// HP regeneration (called every 5 seconds)
function regenerateHP() {
    if (currentHP < maxHP) {
        // Regenerate 1% of max HP per tick
        const regenAmount = maxHP * 0.01;
        currentHP = Math.min(maxHP, currentHP + regenAmount);
        updateHPBar();
    }
}

// MP regeneration (called every 2 seconds)
function regenerateMP() {
    if (currentMP < maxMP) {
        // Regenerate 2% of max MP per tick
        const regenAmount = maxMP * 0.02;
        currentMP = Math.min(maxMP, currentMP + regenAmount);
        updateMPBar();
    }
}

document.addEventListener('DOMContentLoaded', function() {
    console.log('Character sheet loaded!');
    console.log('Starting points:', remainingPoints);
    
    // Load character data from localStorage
    const characterData = localStorage.getItem('characterData');
    
    if (characterData) {
        const character = JSON.parse(characterData);
        
        // Update character name
        const nameElement = document.getElementById('characterName');
        if (nameElement) {
            nameElement.textContent = character.name;
        }
        
        // Update character info
        const infoElement = document.getElementById('characterInfo');
        if (infoElement) {
            const genderIcon = character.gender === 'Male' ? '♂️' : character.gender === 'Female' ? '♀️' : '';
            infoElement.textContent = `${genderIcon} ${character.gender} | Race: ${character.race} | Class: ${character.class}`;
        }
        
        // Update level badge
        const levelElement = document.getElementById('characterLevel');
        if (levelElement) {
            levelElement.textContent = character.level;
        }
        
        // Load class-specific starting stats
        if (character.class && classStartingStats[character.class]) {
            // baseStats refers to the class's starting stats
            const baseStats = { ...classStartingStats[character.class] };
            // If the character JSON already contains inventory, use it (persistence)
            if (character.inventory && Array.isArray(character.inventory) && character.inventory.length > 0) {
                inventoryItems = character.inventory;
                console.log(`Loaded ${character.class} equipment from saved character inventory:`, inventoryItems);
            } else {
                // Use class starting items as default
                inventoryItems = classStartingItems[character.class];
                console.log(`Loaded ${character.class} starting equipment:`, inventoryItems);
            }
            // Apply race bonuses
            if (character.race && raceStatBonuses[character.race]) {
                attributes = applyRaceBonuses(baseStats, character.race);
                console.log(`Loaded ${character.class} stats with ${character.race} racial bonuses:`, attributes);
            } else {
            // Default inventory
            inventoryItems = classStartingItems['Warrior'];
                attributes = baseStats;
                console.log(`Loaded ${character.class} starting stats:`, attributes);
            }
            
            // Update all attribute displays
            Object.keys(attributes).forEach(attr => {
                const valueElement = document.getElementById(`${attr}-value`);
                if (valueElement) {
                    valueElement.textContent = attributes[attr];
                }
            });
        } else {
            // Default to Warrior if class not recognized
            let baseStats = { ...classStartingStats['Warrior'] };
            attributes = character.race ? applyRaceBonuses(baseStats, character.race) : baseStats;
            console.log('Using default Warrior stats');
        }
        
        // Load class-specific starting items
        if (character.class && classStartingItems[character.class]) {
            inventoryItems = classStartingItems[character.class];
            console.log(`Loaded ${character.class} starting equipment:`, inventoryItems);
        } else {
            // Default to Warrior if class not recognized
            inventoryItems = classStartingItems['Warrior'];
            console.log('Using default Warrior equipment');
        }
        
        console.log('Loaded character:', character);
    }
    
    // Initialize inventory slots
    createInventorySlots();
    
    // Initialize HP and MP
    updateHPBar();
    updateMPBar();
    
    // Initialize traits display
    updateTraitsDisplay();
    
    // Start regeneration timers
    // HP regenerates every 5 seconds
    setInterval(regenerateHP, 5000);
    
    // MP regenerates every 2 seconds
    setInterval(regenerateMP, 2000);
    
    console.log('HP Regen: Every 5 seconds');
    console.log('MP Regen: Every 2 seconds');
    console.log('Trait system loaded');
});

// ============================================================================
// DNDCHARACTER.HTML - CHARACTER CREATION SCRIPT
// ============================================================================

// Character creation variables
let selectedGender = '';
let selectedRace = '';
let selectedClass = '';

// Update overview card
function updateOverview() {
    const characterName = document.getElementById('characterName');
    const overviewCard = document.getElementById('overviewCard');
    const createBtn = document.getElementById('createBtn');
    
    // Check if elements exist (only on character creation page)
    if (!characterName || !overviewCard || !createBtn) return;
    
    const characterNameValue = characterName.value.trim();

    // Update overview values
    document.getElementById('overviewName').textContent = characterNameValue || '-';
    
    const genderIcon = selectedGender === 'Male' ? '♂️' : selectedGender === 'Female' ? '♀️' : '';
    document.getElementById('overviewGender').textContent = selectedGender ? `${genderIcon} ${selectedGender}` : '-';
    
    document.getElementById('overviewRace').textContent = selectedRace || '-';
    document.getElementById('overviewClass').textContent = selectedClass || '-';

    // Show overview card and enable button only if all fields are filled
    if (characterNameValue && selectedGender && selectedRace && selectedClass) {
        overviewCard.style.display = 'block';
        createBtn.style.opacity = '1';
        createBtn.style.pointerEvents = 'auto';
    } else {
        overviewCard.style.display = 'none';
        createBtn.style.opacity = '0.5';
        createBtn.style.pointerEvents = 'none';
    }
}

// Initialize character creation page
function initCharacterCreation() {
    // Check if we're on the character creation page
    const characterForm = document.getElementById('characterForm');
    if (!characterForm) return; // Not on character creation page

    console.log('Character creation page loaded!');
    
    // ONLOAD - Page load animation
    const container = document.querySelector('.container');
    if (container) {
        container.style.opacity = '0';
        container.style.transform = 'scale(0.9)';
        
        setTimeout(() => {
            container.style.transition = 'all 0.5s ease';
            container.style.opacity = '1';
            container.style.transform = 'scale(1)';
        }, 100);
    }

    // Load draft data if exists
    const draft = localStorage.getItem('characterDraft');
    if (draft) {
        const data = JSON.parse(draft);
        const nameInput = document.getElementById('characterName');
        if (nameInput) {
            nameInput.value = data.name || '';
        }
    }

    // ONUNLOAD - Save draft when leaving page
    window.onunload = function() {
        const nameInput = document.getElementById('characterName');
        if (!nameInput) return;
        
        const characterName = nameInput.value.trim();
        if (characterName && !localStorage.getItem('characterData')) {
            const draft = {
                name: characterName,
                gender: selectedGender,
                race: selectedRace,
                class: selectedClass
            };
            localStorage.setItem('characterDraft', JSON.stringify(draft));
        }
    };

    // Setup name input events
    const nameInput = document.getElementById('characterName');
    if (nameInput) {
        // ONFOCUS - Highlight input when focused
        nameInput.onfocus = function() {
            this.style.transform = 'scale(1.02)';
            this.style.boxShadow = '0 0 20px rgba(139, 90, 43, 0.6), inset 0 2px 6px rgba(0, 0, 0, 0.6)';
        };

        // ONBLUR - Validate and reset input styling when focus lost
        nameInput.onblur = function() {
            this.style.transform = 'scale(1)';
            this.style.boxShadow = 'none';
            
            // Validation on blur
            if (this.value.trim()) {
                this.style.borderColor = '#8b5a2b';
            } else {
                this.style.borderColor = '#5c3a1e';
            }
        };

        // ONCHANGE - Real-time validation of name input
        nameInput.onchange = function() {
            console.log('Name changed to:', this.value);
            const errorMessage = document.getElementById('errorMessage');
            if (this.value.trim()) {
                errorMessage.classList.remove('show');
            }
            updateOverview();
        };

        // Also update on keyup for real-time feedback
        nameInput.addEventListener('keyup', updateOverview);
    }

    // Handle gender selection
    document.querySelectorAll('[data-gender]').forEach(card => {
        // ONCLICK - Select gender
        card.onclick = function() {
            document.querySelectorAll('[data-gender]').forEach(c => c.classList.remove('selected'));
            this.classList.add('selected');
            selectedGender = this.getAttribute('data-gender');
            console.log('Gender selected:', selectedGender);
            document.getElementById('errorMessage').classList.remove('show');
            updateOverview();
        };

        // ONMOUSEOVER - Hover effect
        card.onmouseover = function() {
            if (!this.classList.contains('selected')) {
                this.style.background = 'linear-gradient(135deg, #1a1410 0%, #2b1f17 100%)';
            }
        };

        // ONMOUSEOUT - Remove hover effect
        card.onmouseout = function() {
            if (!this.classList.contains('selected')) {
                this.style.background = 'linear-gradient(135deg, #0d0906 0%, #1a1410 100%)';
            }
        };

        // ONMOUSEDOWN - Press effect
        card.onmousedown = function() {
            this.style.transform = 'scale(0.95)';
        };

        // ONMOUSEUP - Release effect
        card.onmouseup = function() {
            this.style.transform = 'scale(1)';
        };
    });

    // Handle race selection with events
    document.querySelectorAll('[data-race]').forEach(card => {
        // ONCLICK - Select race
        card.onclick = function() {
            document.querySelectorAll('[data-race]').forEach(c => c.classList.remove('selected'));
            this.classList.add('selected');
            selectedRace = this.getAttribute('data-race');
            console.log('Race selected:', selectedRace);
            document.getElementById('errorMessage').classList.remove('show');
            updateOverview();
        };

        // ONMOUSEOVER - Hover effect
        card.onmouseover = function() {
            if (!this.classList.contains('selected')) {
                this.style.background = 'linear-gradient(135deg, #1a1410 0%, #2b1f17 100%)';
            }
        };

        // ONMOUSEOUT - Remove hover effect
        card.onmouseout = function() {
            if (!this.classList.contains('selected')) {
                this.style.background = 'linear-gradient(135deg, #0d0906 0%, #1a1410 100%)';
            }
        };

        // ONMOUSEDOWN - Press effect
        card.onmousedown = function() {
            this.style.transform = 'scale(0.95)';
        };

        // ONMOUSEUP - Release effect
        card.onmouseup = function() {
            this.style.transform = 'scale(1)';
        };
    });

    // Handle Tekken-style class selection
    document.querySelectorAll('.tekken-class-card').forEach(card => {
        // ONCLICK - Select class
        card.onclick = function() {
            document.querySelectorAll('.tekken-class-card').forEach(c => c.classList.remove('selected'));
            this.classList.add('selected');
            selectedClass = this.getAttribute('data-class');
            console.log('Class selected:', selectedClass);
            document.getElementById('errorMessage').classList.remove('show');
            updateOverview();
        };
    });

    // Create button events
    const createBtn = document.querySelector('.create-btn');
    if (createBtn) {
        // ONMOUSEOVER - Button hover
        createBtn.onmouseover = function() {
            this.style.letterSpacing = '2px';
        };

        // ONMOUSEOUT - Button hover out
        createBtn.onmouseout = function() {
            this.style.letterSpacing = 'normal';
        };

        // ONMOUSEDOWN - Button press
        createBtn.onmousedown = function() {
            this.style.transform = 'scale(0.95)';
        };

        // ONMOUSEUP - Button release
        createBtn.onmouseup = function() {
            this.style.transform = 'scale(1)';
        };
    }

    // Handle form submission
    characterForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const nameInput = document.getElementById('characterName');
        const characterName = nameInput ? nameInput.value.trim() : '';
        const errorMessage = document.getElementById('errorMessage');

        // Validation
        if (!characterName || !selectedGender || !selectedRace || !selectedClass) {
            errorMessage.classList.add('show');
            errorMessage.textContent = 'Please fill in all fields!';
            
            // Shake animation for error
            const container = document.getElementById('mainContainer');
            if (container) {
                container.style.animation = 'shake 0.5s';
                setTimeout(() => {
                    container.style.animation = '';
                }, 500);
            }
            return;
        }

        errorMessage.classList.remove('show');

        // Store character data
        const characterData = {
            name: characterName,
            gender: selectedGender,
            race: selectedRace,
            class: selectedClass,
            level: 1
        };

        // Save to the savedCharacters library and set as active character
        try {
            saveCharacterToLibrary(characterData);
            localStorage.removeItem('characterDraft'); // Clear draft
        } catch (e) {
            console.error('Failed to save character to library:', e);
            // Fallback to old behavior
            localStorage.setItem('characterData', JSON.stringify(characterData));
            localStorage.removeItem('characterDraft');
        }

        // Show loading overlay
        const mainContainer = document.getElementById('mainContainer');
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (mainContainer) mainContainer.classList.add('blur');
        if (loadingOverlay) loadingOverlay.classList.add('active');

        // Redirect after loading animation (2.5 seconds)
        setTimeout(() => {
            window.location.href = 'DND.html';
        }, 2500);
    });
}

// Initialize the appropriate page on load
// Helper functions for Load/Create buttons on DND.html
function triggerLoadCharacter() {
    const input = document.getElementById('characterFileInput');
    if (input) input.click();
}

function handleCharacterFile(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            // Basic validation: must have a name property
            if (!data || typeof data !== 'object' || !data.name) {
                alert('Invalid character file. Expected JSON with a name property.');
                return;
            }

            localStorage.setItem('characterData', JSON.stringify(data));
            alert('Character loaded successfully. Reloading sheet...');
            window.location.reload();
        } catch (err) {
            console.error('Failed to parse character file:', err);
            alert('Could not read file. Make sure it is valid JSON.');
        }
    };
    reader.readAsText(file);
}

function createNewCharacter() {
    // Ask for confirmation before navigating to character creation
    const msg = 'Start creating a new character? You will be taken to the character creation page.';
    const proceed = window.confirm(msg);
    if (proceed) {
        // Navigate to the character creation page
        window.location.href = 'dndCharacter.html';
    }
}

// ------------------------------
// Saved characters (library)
// ------------------------------

function getSavedCharacters() {
    try {
        const raw = localStorage.getItem('savedCharacters');
        return raw ? JSON.parse(raw) : [];
    } catch (e) {
        console.error('Failed to parse savedCharacters:', e);
        return [];
    }
}

function setSavedCharacters(list) {
    localStorage.setItem('savedCharacters', JSON.stringify(list));
}

function saveCharacterToLibrary(character) {
    const list = getSavedCharacters();
    const now = new Date().toISOString();
    // Add metadata
    const entry = {
        id: now + '-' + Math.random().toString(36).slice(2, 9),
        name: character.name || 'Unnamed',
        class: character.class || '-',
        race: character.race || '-',
        gender: character.gender || '-',
        level: character.level || 1,
        createdAt: now,
        data: character
    };
    list.unshift(entry); // newest first
    setSavedCharacters(list);
    // Also set this as the active characterData so the sheet loads it immediately
    localStorage.setItem('characterData', JSON.stringify(character));
    return entry;
}

function openSavedCharactersModal() {
    const modal = document.getElementById('savedCharactersModal');
    if (!modal) return;
    modal.style.display = 'flex';
    renderSavedCharacters();
}

function closeSavedCharactersModal() {
    const modal = document.getElementById('savedCharactersModal');
    if (!modal) return;
    modal.style.display = 'none';
}

function renderSavedCharacters() {
    const container = document.getElementById('savedCharactersContainer');
    if (!container) return;
    const list = getSavedCharacters();
    if (list.length === 0) {
        container.innerHTML = '<p style="color:#a0826d; text-align:center; width:100%">No saved characters yet.</p>';
        return;
    }

    container.innerHTML = '';
    list.forEach((entry, idx) => {
        const card = document.createElement('div');
        card.style.background = 'linear-gradient(135deg, #0d0906 0%, #1a1410 100%)';
        card.style.border = '2px solid #5c3a1e';
        card.style.borderRadius = '8px';
        card.style.padding = '10px';
        card.style.display = 'flex';
        card.style.flexDirection = 'column';
        card.style.gap = '8px';

        const title = document.createElement('div');
        title.style.display = 'flex';
        title.style.justifyContent = 'space-between';
        title.innerHTML = `<strong style="color:#cd853f">${escapeHtml(entry.name)}</strong><span style="color:#a0826d">Lvl ${entry.level}</span>`;

        const meta = document.createElement('div');
        meta.style.color = '#a0826d';
        meta.style.fontSize = '0.9em';
        meta.textContent = `${entry.race} • ${entry.class}`;

        const date = document.createElement('div');
        date.style.color = '#8b5a2b';
        date.style.fontSize = '0.75em';
        date.textContent = new Date(entry.createdAt).toLocaleString();

        const actions = document.createElement('div');
        actions.style.display = 'flex';
        actions.style.gap = '8px';

        const loadBtn = document.createElement('button');
        loadBtn.className = 'trait-select-btn';
        loadBtn.textContent = 'Load';
        loadBtn.onclick = function() { loadSavedCharacter(idx); };

        const delBtn = document.createElement('button');
        delBtn.className = 'trait-select-btn';
        delBtn.style.background = 'linear-gradient(135deg, #3d2412 0%, #5c3a1e 100%)';
        delBtn.textContent = 'Delete';
        delBtn.onclick = function() { deleteSavedCharacter(idx); };

        actions.appendChild(loadBtn);
        actions.appendChild(delBtn);

        card.appendChild(title);
        card.appendChild(meta);
        card.appendChild(date);
        card.appendChild(actions);

        container.appendChild(card);
    });
}

function loadSavedCharacter(index) {
    const list = getSavedCharacters();
    if (!list[index]) return;
    const entry = list[index];
    localStorage.setItem('characterData', JSON.stringify(entry.data));
    closeSavedCharactersModal();
    // reload sheet to reflect newly loaded character
    window.location.reload();
}

function deleteSavedCharacter(index) {
    const list = getSavedCharacters();
    if (!list[index]) return;
    const confirmDel = window.confirm(`Delete character "${list[index].name}"? This cannot be undone.`);
    if (!confirmDel) return;
    list.splice(index, 1);
    setSavedCharacters(list);
    renderSavedCharacters();
}

function exportAllCharacters() {
    const list = getSavedCharacters();
    if (!list || list.length === 0) {
        alert('No saved characters to export.');
        return;
    }
    const data = JSON.stringify(list.map(e => e.data), null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'saved_characters.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, function(m) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]; });
}

// ------------------------------
// Rogue mini-game (turn-based)
// ------------------------------
let rogueGame = null;
let rogueKeyHandler = null;

function openRogueGame() {
    const modal = document.getElementById('rogueModal');
    if (!modal) return;
    modal.style.display = 'flex';
    startRogueGame();
    // Keyboard handling while modal open
    rogueKeyHandler = function(e) { handleRogueKey(e); };
    window.addEventListener('keydown', rogueKeyHandler);
}

function closeRogueGame() {
    const modal = document.getElementById('rogueModal');
    if (!modal) return;
    modal.style.display = 'none';
    if (rogueKeyHandler) {
        window.removeEventListener('keydown', rogueKeyHandler);
        rogueKeyHandler = null;
    }
    rogueGame = null;
}

function startRogueGame() {
    // Initialize a simple 10x10 grid
    const size = 10;
    rogueGame = {
        size: size,
        player: { x: Math.floor(size/2), y: Math.floor(size/2), hp: 30 },
        enemies: [],
        goal: null,
        message: '',
        turn: 'player'
    };

    // Place goal at random edge
    const edge = Math.floor(Math.random() * 4);
    let gx = 0, gy = 0;
    if (edge === 0) { gx = 0; gy = Math.floor(Math.random()*size); }
    if (edge === 1) { gx = size-1; gy = Math.floor(Math.random()*size); }
    if (edge === 2) { gx = Math.floor(Math.random()*size); gy = 0; }
    if (edge === 3) { gx = Math.floor(Math.random()*size); gy = size-1; }
    rogueGame.goal = { x: gx, y: gy };

    // Spawn a few enemies at random locations (avoid player and goal)
    const enemyCount = 4;
    for (let i=0;i<enemyCount;i++) {
        let ex, ey, tries=0;
        do {
            ex = Math.floor(Math.random()*size);
            ey = Math.floor(Math.random()*size);
            tries++;
        } while (((ex === rogueGame.player.x && ey === rogueGame.player.y) || (ex === gx && ey === gy) || rogueGame.enemies.find(e=>e.x===ex&&e.y===ey)) && tries < 200);
        rogueGame.enemies.push({ x: ex, y: ey, hp: 10 });
    }

    updateRogueHUD();
    renderRogueGrid();
    setRogueMessage('Game started. Reach the green tile or clear enemies.');
}

function renderRogueGrid() {
    const grid = document.getElementById('rogueGrid');
    if (!grid || !rogueGame) return;
    grid.innerHTML = '';
    const size = rogueGame.size;
    for (let y=0;y<size;y++) {
        for (let x=0;x<size;x++) {
            const cell = document.createElement('div');
            cell.style.width = '36px';
            cell.style.height = '36px';
            cell.style.borderRadius = '4px';
            cell.style.display = 'flex';
            cell.style.alignItems = 'center';
            cell.style.justifyContent = 'center';
            cell.style.fontWeight = 'bold';
            cell.style.userSelect = 'none';

            // background
            cell.style.background = '#101010';
            cell.style.border = '2px solid #2b1f17';

            // player
            if (rogueGame.player.x === x && rogueGame.player.y === y) {
                cell.textContent = '@';
                cell.style.color = '#ffd700';
                cell.style.background = '#2b1f17';
            } else if (rogueGame.goal.x === x && rogueGame.goal.y === y) {
                cell.textContent = '';
                cell.style.background = '#224422';
                cell.style.border = '2px solid #2f7f2f';
            } else {
                const enemy = rogueGame.enemies.find(e=>e.x===x&&e.y===y);
                if (enemy) {
                    cell.textContent = 'E';
                    cell.style.color = '#ff6b6b';
                    cell.style.background = '#351f1f';
                } else {
                    cell.textContent = '';
                }
            }

            grid.appendChild(cell);
        }
    }
    updateRogueHUD();
}

function setRogueMessage(msg) {
    const el = document.getElementById('rogueMessage');
    if (el) el.textContent = msg;
}

function updateRogueHUD() {
    const hp = document.getElementById('rogueHP');
    const turn = document.getElementById('rogueTurn');
    const enemies = document.getElementById('rogueEnemies');
    if (hp) hp.textContent = rogueGame.player.hp;
    if (turn) turn.textContent = rogueGame.turn;
    if (enemies) enemies.textContent = rogueGame.enemies.length;
}

function handleRogueKey(e) {
    if (!rogueGame) return;
    // ignore if modal not visible
    const modal = document.getElementById('rogueModal');
    if (!modal || modal.style.display === 'none') return;

    const key = e.key.toLowerCase();
    let dx=0, dy=0;
    if (key === 'arrowup' || key === 'w') dy = -1;
    if (key === 'arrowdown' || key === 's') dy = 1;
    if (key === 'arrowleft' || key === 'a') dx = -1;
    if (key === 'arrowright' || key === 'd') dx = 1;
    if (dx !== 0 || dy !== 0) {
        e.preventDefault();
        if (rogueGame.turn !== 'player') return;
        playerMove(dx, dy);
    }
}

function playerMove(dx, dy) {
    const nx = rogueGame.player.x + dx;
    const ny = rogueGame.player.y + dy;
    const size = rogueGame.size;
    if (nx < 0 || ny < 0 || nx >= size || ny >= size) {
        setRogueMessage('Cannot move there.');
        return;
    }

    // check enemy at target
    const enemyIdx = rogueGame.enemies.findIndex(e=>e.x===nx && e.y===ny);
    if (enemyIdx !== -1) {
        // attack: remove enemy
        rogueGame.enemies.splice(enemyIdx,1);
        setRogueMessage('You attacked and defeated an enemy!');
        // small self-heal or no damage
    } else {
        // move player
        rogueGame.player.x = nx;
        rogueGame.player.y = ny;
        setRogueMessage('You moved.');
    }

    // check goal
    if (rogueGame.player.x === rogueGame.goal.x && rogueGame.player.y === rogueGame.goal.y) {
        setRogueMessage('You reached the goal — You win!');
        rogueGame.turn = 'ended';
        renderRogueGrid();
        return;
    }

    // if no more enemies and you prefer winning by clearing, you can win
    if (rogueGame.enemies.length === 0) {
        setRogueMessage('All enemies cleared — You win!');
        rogueGame.turn = 'ended';
        renderRogueGrid();
        return;
    }

    rogueGame.turn = 'enemies';
    updateRogueHUD();
    renderRogueGrid();
    // short delay then enemy turn
    setTimeout(() => enemyTurn(), 300);
}

function enemyTurn() {
    if (!rogueGame || rogueGame.turn === 'ended') return;
    // Each enemy moves towards player by one tile (simple AI)
    const px = rogueGame.player.x;
    const py = rogueGame.player.y;
    for (let i=0;i<rogueGame.enemies.length;i++) {
        const e = rogueGame.enemies[i];
        const dx = px - e.x;
        const dy = py - e.y;
        let stepX = 0, stepY = 0;
        if (Math.abs(dx) > Math.abs(dy)) stepX = dx > 0 ? 1 : -1;
        else stepY = dy > 0 ? 1 : -1;

        const nx = e.x + stepX;
        const ny = e.y + stepY;

        // if moving into player -> attack
        if (nx === px && ny === py) {
            rogueGame.player.hp -= 8;
            setRogueMessage('An enemy hit you!');
            // enemy stays in place after attack
        } else {
            // if target cell free (not another enemy, not goal)
            const occupied = rogueGame.enemies.find((other, idx)=> idx!==i && other.x===nx && other.y===ny);
            if (!occupied && !(rogueGame.goal.x===nx && rogueGame.goal.y===ny) && !(rogueGame.player.x===nx && rogueGame.player.y===ny)) {
                e.x = nx; e.y = ny;
            }
        }
    }

    // check player death
    if (rogueGame.player.hp <= 0) {
        rogueGame.player.hp = 0;
        setRogueMessage('You have been defeated. Game over.');
        rogueGame.turn = 'ended';
        renderRogueGrid();
        updateRogueHUD();
        return;
    }

    rogueGame.turn = 'player';
    updateRogueHUD();
    renderRogueGrid();
}

// Note: battle system is implemented centrally in dnd-battle.js.
// The detailed battle implementation was removed from here to avoid
// duplicate definitions (battleState, getClassMoves, etc.).
// initializeAll and DOMContentLoaded listener are kept below.

// Initialize both character creation and battle system
function initializeAll() {
    initCharacterCreation();

    // Add battle system event listeners if needed
    const battleBtn = document.querySelector('.battle-btn');
    if (battleBtn) {
        battleBtn.addEventListener('click', openBattle);
    }

    // Add action button event listeners
    document.querySelectorAll('.action-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const action = this.getAttribute('data-action');
            if (action) {
                chooseAction(action);
            }
        });
    });
}

window.addEventListener('DOMContentLoaded', initializeAll);
