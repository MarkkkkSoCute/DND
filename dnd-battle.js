// D&D 5e Battle System
let battleState = null;
let usedMoves = new Set();

// D&D 5e class-specific moves
function getClassMoves() {
    // Get class from characterData
    let characterClass = 'Warrior'; // default
    try {
        const data = localStorage.getItem('characterData');
        if (data) {
            const char = JSON.parse(data);
            characterClass = char.class || 'Warrior';
        }
    } catch (e) {
        console.warn('Could not load character class:', e);
    }

    // D&D 5e moves by class (Level 1-3 abilities)
    const movesByClass = {
        'Warrior': [
            { 
                id: 'attack', 
                name: 'Attack',
                dice: { count: 1, sides: 8, bonus: 2 }, // Longsword + Str
                type: 'physical',
                desc: 'Longsword attack (1d8+2).'
            },
            { 
                id: 'second-wind', 
                name: 'Second Wind',
                dice: { count: 1, sides: 10, bonus: 1 }, // 1d10 + level
                mpCost: 4,
                type: 'heal',
                desc: 'Regain HP (1d10 + level). Once per battle.',
                cooldown: true
            },
            { 
                id: 'action-surge', 
                name: 'Action Surge',
                dice: { count: 2, sides: 8, bonus: 4 }, // Two attacks!
                mpCost: 6,
                type: 'physical',
                desc: 'Make two weapon attacks. Once per battle.',
                cooldown: true
            }
        ],
        'Rogue': [
            { 
                id: 'sneak-attack', 
                name: 'Sneak Attack',
                dice: { count: 1, sides: 8, sneakDice: 2 }, // dagger(1d8) + sneak(2d6)
                type: 'physical',
                desc: 'Dagger with sneak attack (1d8 + 2d6).'
            },
            { 
                id: 'cunning-action', 
                name: 'Cunning Action',
                dice: { count: 1, sides: 8, advantage: true },
                mpCost: 2,
                type: 'physical',
                desc: 'Quick attack with advantage.'
            },
            { 
                id: 'uncanny-dodge', 
                name: 'Uncanny Dodge',
                type: 'defense',
                desc: 'Halve the next attack\'s damage.',
                defense: 0.5 // multiplier for incoming damage
            }
        ],
        'Mage': [
            { 
                id: 'fire-bolt', 
                name: 'Fire Bolt',
                    dice: { count: 1, sides: 10, bonus: 2 }, // Int bonus
                    mpCost: 3,
                type: 'fire',
                desc: 'Ranged fire attack (1d10 + 2).'
            },
            { 
                id: 'magic-missile', 
                name: 'Magic Missile',
                    dice: { count: 3, sides: 4, bonus: 3 }, // 3 * (1d4+1)
                    mpCost: 6,
                type: 'force',
                desc: 'Three force darts that never miss.',
                cooldown: true
            },
            { 
                id: 'shield', 
                name: 'Shield',
                    type: 'defense',
                    mpCost: 4,
                desc: 'Magical barrier (+5 AC until next turn).',
                defense: 5 // flat reduction
            }
        ],
        'Cleric': [
            { 
                id: 'sacred-flame', 
                name: 'Sacred Flame',
                dice: { count: 1, sides: 8, bonus: 2 }, // Wis bonus
                type: 'radiant',
                desc: 'Divine ranged attack (1d8 + 2).'
            },
            { 
                id: 'cure-wounds', 
                name: 'Cure Wounds',
                dice: { count: 1, sides: 8, bonus: 3 }, // Wis bonus
                mpCost: 5,
                type: 'heal',
                desc: 'Healing touch (1d8 + 3).',
                cooldown: true
            },
            { 
                id: 'spiritual-weapon', 
                name: 'Spiritual Weapon',
                dice: { count: 1, sides: 8, bonus: 3 }, // Wis bonus
                mpCost: 6,
                type: 'force',
                desc: 'Spectral weapon strikes (1d8 + 3).',
                cooldown: true
            }
        ]
    };

    return movesByClass[characterClass] || movesByClass['Warrior'];
}

// D&D style dice rolling
function rollDice(dice) {
    let total = 0;
    
    // Handle advantage (roll twice, take higher)
    if (dice.advantage) {
        const roll1 = rollDice({...dice, advantage: false});
        const roll2 = rollDice({...dice, advantage: false});
        return Math.max(roll1, roll2);
    }
    
    // Normal dice rolls
    for (let i = 0; i < dice.count; i++) {
        total += Math.floor(Math.random() * dice.sides) + 1;
    }
    
    // Add sneak attack damage if applicable
    if (dice.sneakDice) {
        for (let i = 0; i < dice.sneakDice; i++) {
            total += Math.floor(Math.random() * 6) + 1; // d6 for sneak
        }
    }
    
    // Add static bonus
    if (dice.bonus) {
        total += dice.bonus;
    }
    
    return total;
}

function openBattle() {
    const modal = document.getElementById('battleModal');
    if (!modal) return;
    modal.style.display = 'flex';
    startBattle();
}

function closeBattle() {
    const modal = document.getElementById('battleModal');
    if (!modal) return;
    modal.style.display = 'none';
    battleState = null;
    usedMoves.clear();
}

// D&D 5e Enemy Types
const enemies = {
    'Goblin Warrior': {
        name: 'Goblin Warrior',
        maxHp: 65,
        moves: [
            { 
                id: 'slash',
                name: 'Sword Slash',
                dice: { count: 2, sides: 6, bonus: 2 },
                desc: 'Two-handed sword attack (2d6+2).'
            },
            {
                id: 'thrust',
                name: 'Shield Thrust',
                dice: { count: 1, sides: 8, bonus: 1 },
                desc: 'Shield bash (1d8+1).'
            }
        ],
        sprite: '👹'
        ,
        loot: [
            { name: 'Rusty Longsword', image: 'longsword.png', description: 'Old but usable longsword. (1d8 slashing)', rarity: 'common', weight: 60 },
            { name: 'Health Potion', image: 'health_potion.png', description: 'Restores 2d4+2 HP when used.', rarity: 'uncommon', weight: 30 },
            { name: 'Goblin Ear', image: 'goblin_ear.png', description: 'Ugly trophy. Can be traded.', rarity: 'common', weight: 10 }
        ]
    },
    'Dire Wolf': {
        name: 'Dire Wolf',
        maxHp: 75,
        moves: [
            {
                id: 'bite',
                name: 'Savage Bite',
                dice: { count: 2, sides: 8, bonus: 3 },
                desc: 'Powerful bite attack (2d8+3).'
            },
            {
                id: 'howl',
                name: 'Intimidating Howl',
                type: 'debuff',
                dice: { count: 1, sides: 4, bonus: 0 },
                desc: 'Reduces player defense.'
            }
        ],
        sprite: '🐺'
        ,
        loot: [
            { name: 'Wolf Pelt', image: 'wolf_pelt.png', description: 'Warm pelt; can be sold or crafted into gear.', rarity: 'common', weight: 70 },
            { name: 'Bite Tusk', image: 'tusk.png', description: 'Sharpened tooth; used in some rituals.', rarity: 'uncommon', weight: 30 }
        ]
    },
    'Dark Mage': {
        name: 'Dark Mage',
        maxHp: 55,
        moves: [
            {
                id: 'shadow-bolt',
                name: 'Shadow Bolt',
                dice: { count: 3, sides: 6, bonus: 0 },
                mpCost: 4,
                desc: 'Dark magic blast (3d6).'
            },
            {
                id: 'life-drain',
                name: 'Life Drain',
                type: 'drain',
                dice: { count: 2, sides: 6, bonus: 0 },
                mpCost: 6,
                desc: 'Drains life to heal self.'
            }
        ],
        sprite: '🧙‍♂️'
        ,
        loot: [
            { name: 'Spell Component Pouch', image: 'components.png', description: 'Contains reagents for spells.', rarity: 'common', weight: 60 },
            { name: 'Minor Mana Potion', image: 'mana_potion.png', description: 'Restores a small amount of MP.', rarity: 'uncommon', weight: 30 },
            { name: 'Corrupted Tome', image: 'tome.png', description: 'A book containing dark lore (story item).', rarity: 'rare', weight: 10 }
        ]
    },
    'Ancient Skeleton': {
        name: 'Ancient Skeleton',
        maxHp: 85,
        moves: [
            {
                id: 'bone-slash',
                name: 'Bone Blade',
                dice: { count: 2, sides: 6, bonus: 4 },
                desc: 'Attacks with ancient sword (2d6+4).'
            },
            {
                id: 'reassemble',
                name: 'Reassemble',
                type: 'heal',
                dice: { count: 2, sides: 8, bonus: 2 },
                mpCost: 5,
                desc: 'Repairs damage (2d8+2).'
            }
        ],
        sprite: '💀'
        ,
        loot: [
            { name: 'Ancient Bone', image: 'ancient_bone.png', description: 'A strange bone with runes. (quest item)', rarity: 'rare', weight: 10 },
            { name: 'Cursed Ring', image: 'cursed_ring.png', description: 'A ring that hums with magic. (artifact)', rarity: 'rare', weight: 5 },
            { name: 'Shield Fragment', image: 'shield_fragment.png', description: 'Part of a broken shield; can be repaired.', rarity: 'uncommon', weight: 30 }
        ]
    }
};

// Generate loot based on enemy loot table and simple probabilities
function generateLootForEnemy(enemy) {
    if (!enemy || !enemy.loot) return [];

    const drops = [];
    // Weighted random selection helper
    function weightedPick(list) {
        const total = list.reduce((s, it) => s + (it.weight || 1), 0);
        let r = Math.random() * total;
        for (let i = 0; i < list.length; i++) {
            const w = list[i].weight || 1;
            if (r < w) return list[i];
            r -= w;
        }
        return list[list.length - 1];
    }

    const pool = enemy.loot.slice();

    // Primary drop by weight
    const primary = weightedPick(pool);
    if (primary) drops.push(primary);

    // 40% chance to drop a second distinct item
    if (Math.random() < 0.4) {
        const remaining = pool.filter(p => p.name !== primary.name);
        if (remaining.length > 0) drops.push(weightedPick(remaining));
    }

    // Small chance to include a rare special drop (prefer items with rarity 'rare')
    if (Math.random() < 0.08) {
        const rares = pool.filter(p => p.rarity === 'rare');
        if (rares.length > 0) drops.push(rares[Math.floor(Math.random() * rares.length)]);
    }

    return drops;
}

function startBattle() {
    const playerMaxHP = Math.max(30, calculateMaxHP());
    
    // Randomly select an enemy
    const enemyTypes = Object.keys(enemies);
    const selectedEnemy = enemies[enemyTypes[Math.floor(Math.random() * enemyTypes.length)]];

    battleState = {
        turn: 'player',
        resolving: false,
        player: {
            name: document.getElementById('characterName')?.textContent || 'Hero',
            hp: playerMaxHP,
            maxHp: playerMaxHP,
            defense: 0,
            // MP system: default max MP; class or attributes could modify this later
            maxMp: 50,
            mp: 50,
            moves: getClassMoves()
        },
        enemy: {
            name: selectedEnemy.name,
            hp: selectedEnemy.maxHp,
            maxHp: selectedEnemy.maxHp,
            // enemy MP: scale with HP to keep numbers reasonable
            maxMp: Math.max(20, Math.floor(selectedEnemy.maxHp / 2)),
            mp: Math.max(20, Math.floor(selectedEnemy.maxHp / 2)),
            moves: selectedEnemy.moves,
            sprite: selectedEnemy.sprite,
            loot: selectedEnemy.loot // Store loot table for later
        }
    };
    
    // Debug log
    console.log('Selected enemy:', selectedEnemy.name, 'with sprite:', selectedEnemy.sprite);

    renderBattleUI();
    setBattleMessage('A ' + battleState.enemy.name + ' challenges you to combat!');
}

function renderBattleUI() {
    if (!battleState) return;

    // Update HP bars and text
    const elements = {
        pBar: document.getElementById('playerHPBar'),
        eBar: document.getElementById('enemyHPBar'),
        pText: document.getElementById('playerHPText'),
        eText: document.getElementById('enemyHPText'),
        // Prefer battle-pane MP elements, fall back to page-level MP display
        pMpBar: document.getElementById('playerMPBar') || document.getElementById('mpBar'),
        pMpText: document.getElementById('playerMPText') || document.getElementById('mpText'),
        eMpBar: document.getElementById('enemyMPBar') || document.getElementById('mpBar'),
        eMpText: document.getElementById('enemyMPText') || document.getElementById('mpText'),
        bPlayerHP: document.getElementById('battlePlayerHP'),
        bEnemyHP: document.getElementById('battleEnemyHP'),
        turnEl: document.getElementById('battleTurn'),
        enemyName: document.getElementById('enemyName'),
        enemySprite: document.getElementById('enemySprite')
    };

    const pPerc = Math.max(0, (battleState.player.hp / battleState.player.maxHp) * 100);
    const ePerc = Math.max(0, (battleState.enemy.hp / battleState.enemy.maxHp) * 100);

    if (elements.pBar) elements.pBar.style.width = pPerc + '%';
    if (elements.eBar) elements.eBar.style.width = ePerc + '%';
    if (elements.pText) elements.pText.textContent = `${battleState.player.hp} / ${battleState.player.maxHp}`;
    if (elements.eText) elements.eText.textContent = `${battleState.enemy.hp} / ${battleState.enemy.maxHp}`;
    if (elements.bPlayerHP) elements.bPlayerHP.textContent = battleState.player.hp;
    if (elements.bEnemyHP) elements.bEnemyHP.textContent = battleState.enemy.hp;
    // Update MP bar and text if present
    if (elements.pMpBar) {
        const mpPerc = Math.max(0, (battleState.player.mp / battleState.player.maxMp) * 100);
        elements.pMpBar.style.width = mpPerc + '%';
    }
    if (elements.pMpText) elements.pMpText.textContent = `${battleState.player.mp} / ${battleState.player.maxMp}`;
    if (elements.eMpBar) {
        const empPerc = Math.max(0, (battleState.enemy.mp / battleState.enemy.maxMp) * 100);
        elements.eMpBar.style.width = empPerc + '%';
    }
    if (elements.eMpText) elements.eMpText.textContent = `${battleState.enemy.mp} / ${battleState.enemy.maxMp}`;
    if (elements.turnEl) elements.turnEl.textContent = battleState.turn === 'player' ? 'Player' : 'Enemy';
    
    // Update enemy name and sprite
    if (elements.enemyName) elements.enemyName.textContent = battleState.enemy.name;
    if (elements.enemySprite) {
        elements.enemySprite.innerHTML = battleState.enemy.sprite || '❓';
        console.log('Updated enemy sprite to:', battleState.enemy.sprite); // Debug log
    }
}

function setBattleMessage(msg) {
    const el = document.getElementById('battleMessage');
    if (el) el.textContent = msg;
}

function chooseAction(action) {
    if (!battleState || battleState.resolving) return;
    if (battleState.turn !== 'player') return;

    if (action === 'fight') {
        showMoves();
        setBattleMessage('Choose your attack.');
    } else if (action === 'run') {
        // DC 15 Dexterity check to flee
        const roll = Math.floor(Math.random() * 20) + 1 + 2; // +2 from DEX
        if (roll >= 15) {
            setBattleMessage('You escaped successfully!');
            setTimeout(() => closeBattle(), 800);
        } else {
            setBattleMessage('Failed to escape! Enemy attacks!');
            battleState.turn = 'enemy';
            renderBattleUI();
            setTimeout(() => enemyTurn(), 800);
        }
    } else if (action === 'bag') {
        // Open the bag modal (implemented in dnd.js). Do not end the player's turn automatically;
        if (typeof window.showBagModal === 'function') {
            window.showBagModal();
            setBattleMessage('Open your bag.');
        } else {
            setBattleMessage('No items available.');
        }
    } else {
        setBattleMessage(action === 'bag' ? 'No items available.' : 'No party members to switch.');
        return; // Don't change turns for invalid actions
    }
}

function showMoves() {
    const movesMenu = document.getElementById('movesMenu');
    if (!movesMenu || !battleState) return;

    movesMenu.innerHTML = '';
    battleState.player.moves.forEach((move, idx) => {
        const btn = document.createElement('button');
        btn.className = 'trait-select-btn';

        // Build inner HTML with move name and optional MP badge
        const nameSpan = `<span class="move-name">${escapeHtml(move.name || '')}</span>`;
        const typeTag = move.type === 'heal' ? ' <em>(Heal)</em>' : move.type === 'defense' ? ' <em>(Defense)</em>' : '';
    const mpBadge = move.mpCost ? ` <span class="mp-badge">MP ${move.mpCost}</span>` : '';

        btn.innerHTML = nameSpan + mpBadge + typeTag;
        btn.title = move.desc || '';

        // Disable button if move on cooldown or not enough MP
        if (move.cooldown && usedMoves.has(move.id)) {
            btn.disabled = true;
            btn.style.opacity = '0.5';
            btn.style.cursor = 'not-allowed';
        }
        if (move.mpCost && (typeof battleState.player.mp === 'number') && battleState.player.mp < move.mpCost) {
            btn.disabled = true;
            btn.style.opacity = '0.5';
            btn.style.cursor = 'not-allowed';
        }

        btn.onclick = function() { performPlayerMove(idx); };
        movesMenu.appendChild(btn);
    });
    movesMenu.style.display = 'flex';
}

function performPlayerMove(moveIndex) {
    if (!battleState || battleState.turn !== 'player' || battleState.resolving) return;
    
    const move = battleState.player.moves[moveIndex];
    if (!move || (move.cooldown && usedMoves.has(move.id))) {
        setBattleMessage(move.cooldown ? 'That ability is on cooldown!' : 'Cannot use that move!');
        return;
    }

    // Check MP cost first
    if (move.mpCost && battleState.player.mp < move.mpCost) {
        setBattleMessage('Not enough MP to use ' + move.name + '!');
        return;
    }

    // Deduct MP
    if (move.mpCost) {
        battleState.player.mp = Math.max(0, battleState.player.mp - move.mpCost);
    }

    battleState.resolving = true;
    setBattleMessage(`${battleState.player.name} used ${move.name}!`);

    setTimeout(() => {
        let amount = 0;
        
        if (move.dice) {
            amount = rollDice(move.dice);
        } else if (move.defense) {
            battleState.player.defense = move.defense;
            setBattleMessage(`${battleState.player.name} prepared for defense!`);
        }

        // Apply effects based on move type
        switch(move.type) {
            case 'heal':
                battleState.player.hp = Math.min(
                    battleState.player.maxHp,
                    battleState.player.hp + amount
                );
                setBattleMessage(`${battleState.player.name} healed for ${amount} HP!`);
                break;
                
            case 'defense':
                // Defense value already set above
                break;
                
            case 'physical':
            case 'fire':
            case 'force':
            case 'radiant':
                // Check for critical hit (natural 20)
                if (Math.random() < 0.05) {
                    amount *= 2;
                    setBattleMessage('Critical hit!');
                }
                battleState.enemy.hp = Math.max(0, battleState.enemy.hp - amount);
                setBattleMessage(`${move.name} dealt ${amount} damage!`);
                break;
        }

        // Mark cooldown move as used
        if (move.cooldown) {
            usedMoves.add(move.id);
        }

        renderBattleUI();

        // Check for victory
        if (battleState.enemy.hp <= 0) {
            setBattleMessage('Enemy defeated! Victory!');
            battleState.turn = 'ended';
            battleState.resolving = false;
            const movesMenu = document.getElementById('movesMenu');
            if (movesMenu) movesMenu.style.display = 'none';

            // Generate loot and add to inventory
            try {
                const drops = generateLootForEnemy(battleState.enemy) || [];
                if (drops.length > 0) {
                    // Prefer showing an interactive loot modal that lets the player choose what to take
                    if (typeof window.showLootModal === 'function') {
                        setTimeout(() => window.showLootModal(drops), 300);
                    } else if (typeof window.addItemToInventory === 'function') {
                        // Fallback: auto-add if modal not available
                        drops.forEach((it, idx) => {
                            setTimeout(() => window.addItemToInventory(it), 150 * idx);
                        });
                        if (typeof window.showLootToast === 'function') {
                            setTimeout(() => window.showLootToast(drops), 300);
                        }
                    }
                }
            } catch (e) {
                console.error('Failed to generate or add loot:', e);
            }

            return;
        }

        // Enemy's turn
        battleState.turn = 'enemy';
        battleState.resolving = false;
        renderBattleUI();
        const movesMenu = document.getElementById('movesMenu');
        if (movesMenu) movesMenu.style.display = 'none';
        setTimeout(() => enemyTurn(), 800);
    }, 500);
}

function enemyTurn() {
    if (!battleState || battleState.turn !== 'enemy') return;
    battleState.resolving = true;

    const enemy = battleState.enemy;
    // Choose a move the enemy can afford (prefer mp-cost moves if available)
    let affordable = enemy.moves.filter(m => !m.mpCost || (typeof enemy.mp === 'number' && enemy.mp >= m.mpCost));
    // If no affordable moves, fall back to any physical/no-mp move
    if (affordable.length === 0) {
        affordable = enemy.moves.filter(m => !m.type || m.type === 'physical');
    }
    const move = affordable.length > 0 ? affordable[Math.floor(Math.random() * affordable.length)] : enemy.moves[0];
    setBattleMessage(`${enemy.name} used ${move.name}!`);

    setTimeout(() => {
        const amount = move.dice ? rollDice(move.dice) : 0;
        // Deduct MP cost if any
        if (move.mpCost) {
            enemy.mp = Math.max(0, (enemy.mp || 0) - move.mpCost);
        }
        
        // Handle different move types
        switch(move.type) {
            case 'heal':
                // Healing move
                enemy.hp = Math.min(enemy.maxHp, enemy.hp + amount);
                setBattleMessage(`${enemy.name} healed for ${amount} HP!`);
                break;

            case 'drain':
                // Life drain move - damage player and heal self
                let drainDamage = amount;
                if (battleState.player.defense) {
                    drainDamage = Math.max(0, drainDamage - battleState.player.defense);
                }
                battleState.player.hp = Math.max(0, battleState.player.hp - drainDamage);
                enemy.hp = Math.min(enemy.maxHp, enemy.hp + Math.floor(drainDamage / 2));
                setBattleMessage(`${enemy.name} drained ${drainDamage} HP!`);
                break;

            case 'debuff':
                // Debuff move - reduce player defense
                battleState.player.defense = Math.max(0, battleState.player.defense - amount);
                setBattleMessage(`${enemy.name} weakened your defenses!`);
                break;

            default:
                // Standard damage move
                let damage = amount;
                
                // Critical hit for enemy (5% chance)
                if (Math.random() < 0.05) {
                    damage *= 2;
                    setBattleMessage('Critical hit!');
                }

                // Apply player's defense
                if (battleState.player.defense) {
                    if (typeof battleState.player.defense === 'number') {
                        // Flat reduction (like Shield spell)
                        damage = Math.max(0, damage - battleState.player.defense);
                    } else {
                        // Percentage reduction (like Uncanny Dodge)
                        damage = Math.floor(damage * battleState.player.defense);
                    }
                    battleState.player.defense = 0; // Reset defense
                }

                battleState.player.hp = Math.max(0, battleState.player.hp - damage);
                setBattleMessage(`${enemy.name} dealt ${damage} damage!`);
                break;
        }

        renderBattleUI();

        if (battleState.player.hp <= 0) {
            setBattleMessage('You were defeated...');
            battleState.turn = 'ended';
            battleState.resolving = false;
            return;
        }

        // At the end of the enemy's turn, restore a small amount of MP to the player
        battleState.player.mp = Math.min(battleState.player.maxMp, (battleState.player.mp || 0) + 5);

        battleState.turn = 'player';
        battleState.resolving = false;
        renderBattleUI();
        setBattleMessage('Choose your action!');
    }, 600);
}