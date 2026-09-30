let notes = JSON.parse(localStorage.getItem('smart_notes_app')) || [];
let selectedColor = '#ffffff';
let currentWorkingId = null;

function selectColor(element) {
    document.querySelectorAll('.color-option').forEach(el => el.classList.remove('selected'));
    element.classList.add('selected');
    selectedColor = element.getAttribute('data-color');
    autoSaveNote();
}

function autoSaveNote() {
    const title = document.getElementById('note-title').value.trim();
    const content = document.getElementById('note-content').value.trim();
    const category = document.getElementById('note-category').value;

    if (!title && !content) return;

    const now = new Date();
    const timeString = `${now.toLocaleDateString('th-TH')} ${now.toLocaleTimeString('th-TH', {hour: '2-digit', minute:'2-digit'})}`;

    if (currentWorkingId) {
        notes = notes.map(note => {
            if (note.id == currentWorkingId) {
                return { ...note, title: title || 'ไม่มีหัวข้อ', content, category, color: selectedColor, updatedAt: timeString };
            }
            return note;
        });
    } else {
        currentWorkingId = Date.now();
        document.getElementById('note-id').value = currentWorkingId;
        document.getElementById('cancel-btn').style.display = 'inline-block';

        const newNote = {
            id: currentWorkingId,
            title: title || 'ไม่มีหัวข้อ',
            content,
            category,
            color: selectedColor,
            isPinned: false,
            createdAt: timeString,
            updatedAt: null
        };
        notes.unshift(newNote);
    }

    saveToLocalStorage();
    renderNotes();
    showSaveStatus();
}

function showSaveStatus() {
    const statusEl = document.getElementById('save-status');
    statusEl.style.display = 'inline-flex';
    setTimeout(() => {
        statusEl.style.display = 'none';
    }, 1500);
}

function renderNotes() {
    const container = document.getElementById('notes-container');
    const searchText = document.getElementById('search-input').value.toLowerCase();
    const filterCat = document.getElementById('filter-category').value;

    container.innerHTML = '';

    let filtered = notes.filter(note => {
        const matchSearch = note.title.toLowerCase().includes(searchText) || note.content.toLowerCase().includes(searchText);
        const matchCat = filterCat === 'ทั้งหมด' || note.category === filterCat;
        return matchSearch && matchCat;
    });

    filtered.sort((a, b) => b.isPinned - a.isPinned);

    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fa-regular fa-folder-open" style="font-size: 40px; margin-bottom: 10px;"></i>
                <p>ไม่พบโน้ตในระบบ</p>
            </div>`;
        return;
    }

    filtered.forEach(note => {
        const card = document.createElement('div');
        card.className = `note-card ${note.isPinned ? 'pinned' : ''}`;
        card.style.backgroundColor = note.color;
        card.style.borderTopColor = note.isPinned ? '#f39c12' : '#ccc';

        card.innerHTML = `
            ${note.isPinned ? '<div class="pin-badge"><i class="fa-solid fa-thumbtack"></i></div>' : ''}
            <div>
                <div class="note-title">${escapeHTML(note.title)}</div>
                <span class="note-category">${note.category}</span>
                <div class="note-content">${escapeHTML(note.content)}</div>
            </div>
            <div class="note-footer">
                <span>${note.updatedAt ? 'แก้ไขล่าสุด: ' + note.updatedAt : note.createdAt}</span>
                <div class="card-actions">
                    <button class="action-btn" onclick="togglePin(${note.id})" title="${note.isPinned ? 'ยกเลิกการปักหมุด' : 'ปักหมุด'}">
                        <i class="fa-solid fa-thumbtack" style="color: ${note.isPinned ? '#f39c12' : '#aaa'}"></i>
                    </button>
                    <button class="action-btn" onclick="exportNote(${note.id})" title="ดาวน์โหลดไฟล์ .txt">
                        <i class="fa-solid fa-download"></i>
                    </button>
                    <button class="action-btn" onclick="editNote(${note.id})" title="แก้ไข">
                        <i class="fa-solid fa-pen"></i>
                    </button>
                    <button class="action-btn delete" onclick="deleteNote(${note.id})" title="ลบ">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

function editNote(id) {
    const note = notes.find(n => n.id === id);
    if (note) {
        currentWorkingId = note.id;
        document.getElementById('note-id').value = note.id;
        document.getElementById('note-title').value = note.title;
        document.getElementById('note-content').value = note.content;
        document.getElementById('note-category').value = note.category;
        
        document.querySelectorAll('.color-option').forEach(el => {
            if (el.getAttribute('data-color') === note.color) {
                selectColor(el);
            }
        });

        document.getElementById('cancel-btn').style.display = 'inline-block';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function resetForm() {
    currentWorkingId = null;
    document.getElementById('note-id').value = '';
    document.getElementById('note-title').value = '';
    document.getElementById('note-content').value = '';
    document.getElementById('cancel-btn').style.display = 'none';
    
    selectColor(document.querySelector('.color-option[data-color="#ffffff"]'));
}

function togglePin(id) {
    notes = notes.map(note => note.id === id ? { ...note, isPinned: !note.isPinned } : note);
    saveToLocalStorage();
    renderNotes();
}

function deleteNote(id) {
    if (confirm('คุณแน่ใจหรือไม่ว่าต้องการลบโน้ตนี้?')) {
        notes = notes.filter(note => note.id !== id);
        if (currentWorkingId === id) resetForm();
        saveToLocalStorage();
        renderNotes();
    }
}

function exportNote(id) {
    const note = notes.find(n => n.id === id);
    if (!note) return;

    const textContent = `\uFEFFหัวข้อ: ${note.title}\nหมวดหมู่: ${note.category}\nสร้างเมื่อ: ${note.createdAt}\n-----------------------------------\n\n${note.content}`;
    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${note.title.replace(/[/\\?%*:|"<>]/g, '_')}.txt`;
    link.click();
}

function saveToLocalStorage() {
    localStorage.setItem('smart_notes_app', JSON.stringify(notes));
}

function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );
}

renderNotes();
