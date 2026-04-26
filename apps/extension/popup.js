const STORAGE_KEY = 'quick_notes_data';
const CATEGORIES_KEY = 'quick_notes_categories';
const WINDOW_SIZE_KEY = 'quick_notes_window_size';
const THEME_KEY = 'quick_notes_theme';
const FONT_SIZE_KEY = 'quick_notes_font_size';

// DOM Elements
const tabsContainer = document.getElementById('tabs');
const btnAdd = document.getElementById('btn-add');
const btnDelete = document.getElementById('btn-delete');
const noteContent = document.getElementById('note-content');
const btnImport = document.getElementById('btn-import');
const btnExport = document.getElementById('btn-export');
const fileInput = document.getElementById('file-input');
const btnSettings = document.getElementById('btn-settings');
const settingsModal = document.getElementById('settings-modal');
const modalClose = document.getElementById('modal-close');
const categoryList = document.getElementById('category-list');
const newCategoryName = document.getElementById('new-category-name');
const btnAddCategory = document.getElementById('btn-add-category');
const notesByCategory = document.getElementById('notes-by-category');
const renameCategoryModal = document.getElementById('rename-category-modal');
const renameModalClose = document.getElementById('rename-modal-close');
const renameCategoryInput = document.getElementById('rename-category-input');
const renameCategoryId = document.getElementById('rename-category-id');
const btnCancelRename = document.getElementById('btn-cancel-rename');
const btnConfirmRename = document.getElementById('btn-confirm-rename');
const confirmDeleteModal = document.getElementById('confirm-delete-modal');
const confirmDeleteClose = document.getElementById('confirm-delete-close');
const confirmDeleteMessage = document.getElementById('confirm-delete-message');
const btnCancelDelete = document.getElementById('btn-cancel-delete');
const btnConfirmDelete = document.getElementById('btn-confirm-delete');
const setTitleModal = document.getElementById('set-title-modal');
const setTitleClose = document.getElementById('set-title-close');
const setTitleInput = document.getElementById('set-title-input');
const setTitleNoteId = document.getElementById('set-title-note-id');
const btnCancelTitle = document.getElementById('btn-cancel-title');
const btnConfirmTitle = document.getElementById('btn-confirm-title');
const customWidth = document.getElementById('custom-width');
const customHeight = document.getElementById('custom-height');
const btnApplyCustomSize = document.getElementById('btn-apply-custom-size');
const sizePresets = document.querySelectorAll('.btn-size-preset');
const btnCustomToggle = document.getElementById('btn-custom-toggle');
const customSizePanel = document.getElementById('custom-size-panel');
const btnVisitWebsite = document.getElementById('btn-visit-website');
const btnInsertTime = document.getElementById('btn-insert-time');
const btnInsertUrl = document.getElementById('btn-insert-url');
const btnInsertDate = document.getElementById('btn-insert-date');

// State
let notes = {};
let categories = {};
let activeTabId = null;
let saveTimeout = null;
let selectedCategory = 'uncategorized'; // Default to uncategorized
let pendingDeleteAction = null; // Store pending delete action

// Initialize
async function init() {
  try {
    const result = await chrome.storage.local.get([STORAGE_KEY, CATEGORIES_KEY, WINDOW_SIZE_KEY, THEME_KEY, FONT_SIZE_KEY]);
    notes = result[STORAGE_KEY] || {};
    categories = result[CATEGORIES_KEY] || { 'uncategorized': { name: 'Uncategorized' } };
    
    // Load window size with viewport constraint
    const windowSize = result[WINDOW_SIZE_KEY];
    if (windowSize) {
      // Apply the saved size directly (CSS will handle max constraints)
      applyWindowSize(windowSize.width, windowSize.height);
      
      // Update UI to show the saved preset selection
      await loadCurrentWindowSize();
    } else {
      // Set default window size to Large (650x800)
      const defaultWidth = 650;
      const defaultHeight = 800;
      applyWindowSize(defaultWidth, defaultHeight);
      
      // Save the default size
      await chrome.storage.local.set({ [WINDOW_SIZE_KEY]: { width: defaultWidth, height: defaultHeight } });
      
      // Update UI to show Large as selected
      await loadCurrentWindowSize();
    }
    
    // Load theme
    const theme = result[THEME_KEY];
    if (theme) {
      applyTheme(theme);
    } else {
      // Set default theme to Light (white)
      const defaultTheme = {
        type: 'preset',
        name: 'light'
      };
      applyTheme(defaultTheme);
      
      // Save the default theme
      await chrome.storage.local.set({ [THEME_KEY]: defaultTheme });
    }
    
    // Load font size
    const fontSize = result[FONT_SIZE_KEY];
    if (fontSize) {
      applyFontSize(fontSize);
    } else {
      // Set default font size to Medium (14px)
      const defaultFontSize = 14;
      applyFontSize(defaultFontSize);
      
      // Save the default size
      await chrome.storage.local.set({ [FONT_SIZE_KEY]: defaultFontSize });
      
      // Update UI to show Medium as selected when settings open
      // (loadCurrentFontSize will be called when settings modal opens)
    }

    // Initialize default tabs if empty
    if (Object.keys(notes).length === 0) {
      notes = {
        '1': { name: '1', content: '', category: 'uncategorized' },
        '2': { name: '2', content: '', category: 'uncategorized' },
        '3': { name: '3', content: '', category: 'uncategorized' }
      };
      await saveNotes();
    }

    // Ensure all notes have a category
    for (const id in notes) {
      if (!notes[id].category) {
        notes[id].category = 'uncategorized';
      }
    }

    // Get active tab from storage
    const activeResult = await chrome.storage.local.get(['activeTabId']);
    activeTabId = activeResult.activeTabId || null;

    // Make sure active tab exists and is valid
    if (!activeTabId || !notes[activeTabId]) {
      // Find the first note in the selected category
      const firstNote = Object.entries(notes)
        .filter(([id, note]) => note.category === selectedCategory)
        .sort((a, b) => {
          const numA = parseInt(a[0]) || 0;
          const numB = parseInt(b[0]) || 0;
          return numA - numB;
        })[0];
      
      if (firstNote) {
        activeTabId = firstNote[0];
      } else {
        // If no notes in selected category, use first available note
        activeTabId = Object.keys(notes).sort((a, b) => {
          const numA = parseInt(a) || 0;
          const numB = parseInt(b) || 0;
          return numA - numB;
        })[0];
      }
      
      // Save the active tab ID
      await chrome.storage.local.set({ activeTabId: activeTabId });
    }

    // Update selected category based on active tab
    if (notes[activeTabId]) {
      selectedCategory = notes[activeTabId].category || 'uncategorized';
    }

    renderTabs();
    showTab(activeTabId);
  } catch (error) {
    console.error('Error initializing:', error);
  }
}

// Render all tabs grouped by category
function renderTabs() {
  tabsContainer.innerHTML = '';
  
  // Create category buttons row
  const categoriesRow = document.createElement('div');
  categoriesRow.className = 'categories-row';
  
  // Add category buttons
  const catIds = Object.keys(categories).sort();
  catIds.forEach(catId => {
    const btn = document.createElement('div');
    btn.className = `category-btn ${selectedCategory === catId ? 'selected' : ''}`;
    
    // Count notes in this category
    const noteCount = Object.values(notes).filter(note => note.category === catId).length;
    btn.textContent = `${categories[catId].name} (${noteCount})`;
    
    btn.addEventListener('click', () => selectCategory(catId));
    categoriesRow.appendChild(btn);
  });
  
  tabsContainer.appendChild(categoriesRow);
  
  // Create notes container for selected category
  const notesContainer = document.createElement('div');
  notesContainer.className = 'notes-container';
  
  // Get notes for selected category
  const categoryNotes = Object.entries(notes)
    .filter(([id, note]) => note.category === selectedCategory)
    .sort((a, b) => {
      // Sort by order if exists, otherwise by ID
      const orderA = a[1].order !== undefined ? a[1].order : 999;
      const orderB = b[1].order !== undefined ? b[1].order : 999;
      if (orderA !== orderB) return orderA - orderB;
      const numA = parseInt(a[0]) || 0;
      const numB = parseInt(b[0]) || 0;
      return numA - numB;
    });
  
  if (categoryNotes.length > 0) {
    const notesRow = document.createElement('div');
    notesRow.className = 'notes-row';
    
    // Re-index notes within the category starting from 1
    categoryNotes.forEach(([noteId, note], index) => {
      const tab = document.createElement('div');
      tab.className = `tab ${noteId === activeTabId ? 'active' : ''}`;
      tab.dataset.id = noteId;
      
      const nameSpan = document.createElement('span');
      nameSpan.className = 'tab-name';
      // Display custom title if set, otherwise display sequential number
      nameSpan.textContent = note.title || String(index + 1);
      
      tab.appendChild(nameSpan);
      
      // Double-click to set title
      tab.addEventListener('dblclick', () => {
        openSetTitleModal(noteId);
      });
      
      tab.addEventListener('click', () => {
        switchTab(noteId);
      });
      
      notesRow.appendChild(tab);
    });
    
    notesContainer.appendChild(notesRow);
  } else {
    // Show empty state
    const emptyMsg = document.createElement('div');
    emptyMsg.className = 'empty-category';
    emptyMsg.textContent = 'No notes in this category. Click + to add one.';
    notesContainer.appendChild(emptyMsg);
  }
  
  tabsContainer.appendChild(notesContainer);
}

// Switch to a tab
async function switchTab(id) {
  if (id === activeTabId) return;

  // Save current content before switching
  await saveCurrentContent();

  activeTabId = id;
  await chrome.storage.local.set({ activeTabId: id });
  renderTabs();
  showTab(id);
}

// Show tab content
function showTab(id) {
  const tab = notes[id];
  if (tab) {
    noteContent.innerHTML = tab.content || '';
  }
}

// Add new tab
async function addTab() {
  const tabIds = Object.keys(notes).map(id => parseInt(id) || 0);
  const newId = String(Math.max(...tabIds, 0) + 1);
  const newName = String(parseInt(newId));

  // Set order to be after all existing notes in this category
  const categoryNotes = Object.values(notes).filter(note => note.category === selectedCategory);
  const maxOrder = Math.max(-1, ...categoryNotes.map(note => note.order !== undefined ? note.order : -1));
  
  // Use the currently selected category
  notes[newId] = { name: newName, content: '', category: selectedCategory, order: maxOrder + 1 };
  await saveNotes();

  activeTabId = newId;
  await chrome.storage.local.set({ activeTabId: newId });

  // Re-enable text area if it was disabled
  noteContent.contentEditable = 'true';
  noteContent.style.opacity = '1';
  noteContent.style.cursor = '';

  renderTabs();
  showTab(newId);
  noteContent.focus();
  
  // Scroll to the new note button
  setTimeout(() => {
    scrollToNote(newId);
  }, 100);
}

// Delete current note
function confirmDeleteNote() {
  if (!activeTabId || !notes[activeTabId]) {
    alert('No note selected.\n\nTo delete a category, please click the Settings button.');
    return;
  }
  
  const note = notes[activeTabId];
  const noteName = note.title || `Note ${activeTabId}`;
  
  // Check if note is empty (no content and no title)
  const isEmpty = !note.content && !note.title;
  
  if (isEmpty) {
    // Directly delete empty notes without confirmation
    deleteNote(activeTabId);
  } else {
    // Show confirmation dialog for non-empty notes
    const message = `Are you sure you want to delete "${noteName}"?\n\nThis action cannot be undone.`;
    showConfirmDialog(message, () => deleteNote(activeTabId));
  }
}

async function deleteNote(noteId) {
  // Get notes in current category before deletion
  const categoryNotesBefore = Object.entries(notes)
    .filter(([id, note]) => note.category === selectedCategory);
  
  delete notes[noteId];
  await saveNotes();
  
  // If we deleted the active tab, switch to another note
  if (activeTabId === noteId) {
    const remainingNotes = Object.entries(notes)
      .filter(([id, note]) => note.category === selectedCategory)
      .sort((a, b) => {
        const orderA = a[1].order !== undefined ? a[1].order : 999;
        const orderB = b[1].order !== undefined ? b[1].order : 999;
        if (orderA !== orderB) return orderA - orderB;
        const numA = parseInt(a[0]) || 0;
        const numB = parseInt(b[0]) || 0;
        return numA - numB;
      });
    
    if (remainingNotes.length > 0) {
      // Find the index of the deleted note in the sorted list
      const deletedIndex = categoryNotesBefore.findIndex(([id]) => id === noteId);
      
      // If deleted note was the last one, select the new last note
      // Otherwise, select the note at the same position (which shifts down)
      let newIndex;
      if (deletedIndex >= remainingNotes.length) {
        // Deleted the last note, select the new last note
        newIndex = remainingNotes.length - 1;
      } else {
        // Select the note at the same position (or first if deleted was first)
        newIndex = Math.min(deletedIndex, remainingNotes.length - 1);
      }
      
      activeTabId = remainingNotes[newIndex][0];
      await chrome.storage.local.set({ activeTabId: activeTabId });
    } else {
      // No notes in current category, clear and disable text area
      noteContent.innerHTML = '';
      noteContent.contentEditable = 'false';
      noteContent.style.opacity = '0.5';
      noteContent.style.cursor = 'not-allowed';
      
      // Keep the current category selected
      // Update storage to reflect empty state
      await chrome.storage.local.set({ 
        activeTabId: null,
        selectedCategory: selectedCategory 
      });
      
      activeTabId = null;
    }
  }
  
  renderTabs();
  showTab(activeTabId);
}

// Scroll to a specific note button
function scrollToNote(noteId) {
  const noteButton = document.querySelector(`.tab[data-id="${noteId}"]`);
  if (noteButton) {
    noteButton.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }
}


// Rename a tab (legacy function, now uses setTitle)
async function renameTab(id) {
  openSetTitleModal(id);
}

// Set Title Modal Functions
function openSetTitleModal(noteId) {
  setTitleNoteId.value = noteId;
  setTitleInput.value = notes[noteId].title || '';
  setTitleModal.classList.add('show');
  
  // Focus and select the input text
  setTimeout(() => {
    setTitleInput.focus();
    setTitleInput.select();
  }, 100);
}

function closeSetTitleModal() {
  setTitleModal.classList.remove('show');
  setTitleNoteId.value = '';
  setTitleInput.value = '';
}

async function confirmSetTitle() {
  const noteId = setTitleNoteId.value;
  const title = setTitleInput.value.trim();
  
  if (!noteId) {
    closeSetTitleModal();
    return;
  }
  
  if (title !== '') {
    notes[noteId].title = title;
  } else {
    delete notes[noteId].title;
  }
  
  await saveNotes();
  closeSetTitleModal();
  renderTabs();
}

// Save current textarea content
async function saveCurrentContent() {
  if (activeTabId && notes[activeTabId]) {
    const newContent = noteContent.innerHTML;
    
    try {
      // Estimate storage size before saving
      const usage = await estimateStorageSize();
      const contentSize = new Blob([newContent]).size;
      const estimatedTotal = usage + contentSize;
      
      // Chrome storage limit is typically 10MB (10 * 1024 * 1024 bytes)
      const STORAGE_LIMIT = 10 * 1024 * 1024;
      const WARNING_THRESHOLD = STORAGE_LIMIT * 0.9; // 90%
      
      if (estimatedTotal > STORAGE_LIMIT) {
        alert(`⚠️ Storage Limit Exceeded!\n\nYour notes are approaching the storage limit (${formatBytes(STORAGE_LIMIT)}).\n\nCurrent usage: ${formatBytes(usage)}\nEstimated after save: ${formatBytes(estimatedTotal)}\n\nPlease:\n• Delete some notes\n• Remove large images\n• Export and backup old notes`);
        return;
      }
      
      if (estimatedTotal > WARNING_THRESHOLD) {
        console.warn(`Storage warning: ${formatBytes(estimatedTotal)} / ${formatBytes(STORAGE_LIMIT)}`);
        showPasteNotification('⚠️ Storage almost full!');
      }
      
      // Proceed with save
      notes[activeTabId].content = newContent;
      await saveNotes();
    } catch (error) {
      console.error('Error estimating storage size:', error);
      // Still try to save even if estimation fails
      notes[activeTabId].content = newContent;
      await saveNotes();
    }
  }
}

// Estimate current storage usage
async function estimateStorageSize() {
  try {
    const result = await chrome.storage.local.get(null); // Get all data
    const jsonStr = JSON.stringify(result);
    return new Blob([jsonStr]).size;
  } catch (error) {
    console.error('Error estimating storage:', error);
    return 0;
  }
}

// Format bytes to human-readable format
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Save categories to storage
async function saveCategories() {
  try {
    await chrome.storage.local.set({ [CATEGORIES_KEY]: categories });
  } catch (error) {
    console.error('Error saving categories:', error);
  }
}

// Save notes to storage with debounce
function saveNotes() {
  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }

  saveTimeout = setTimeout(async () => {
    try {
      await chrome.storage.local.set({ [STORAGE_KEY]: notes });
      showSaveIndicator();
    } catch (error) {
      console.error('Error saving notes:', error);
    }
  }, 300);
}

// Show save indicator
function showSaveIndicator() {
  let indicator = document.querySelector('.save-indicator');
  if (!indicator) {
    indicator = document.createElement('div');
    indicator.className = 'save-indicator';
    indicator.textContent = 'Saved';
    document.body.appendChild(indicator);
  }
  indicator.classList.add('show');
  setTimeout(() => indicator.classList.remove('show'), 1000);
}

// Show paste notification
function showPasteNotification(message) {
  let notification = document.querySelector('.paste-notification');
  if (!notification) {
    notification = document.createElement('div');
    notification.className = 'paste-notification';
    document.body.appendChild(notification);
  }
  notification.textContent = message;
  notification.classList.add('show');
  setTimeout(() => notification.classList.remove('show'), 2000);
}

// Theme Functions
const themePresets = {
  light: {
    backgroundColor: '#ffffff',
    textColor: '#333333'
  },
  warm: {
    backgroundColor: 'hsl(30deg 85% 92.16%)',
    textColor: 'hsl(8.57deg 6.31% 21.76%)'
  },
  green: {
    backgroundColor: '#c7edcc',
    textColor: '#000000'
  },
  dark: {
    backgroundColor: '#1e1e1e',
    textColor: '#ffffff'
  }
};

function applyTheme(themeConfig) {
  if (themeConfig.type === 'preset') {
    const preset = themePresets[themeConfig.name];
    if (preset) {
      noteContent.style.backgroundColor = preset.backgroundColor;
      noteContent.style.color = preset.textColor;
      noteContent.style.backgroundImage = 'none';
    }
  } else if (themeConfig.type === 'custom') {
    noteContent.style.backgroundColor = themeConfig.backgroundColor || '#ffffff';
    noteContent.style.color = themeConfig.textColor || '#333333';
    if (themeConfig.backgroundImage) {
      noteContent.style.backgroundImage = `url(${themeConfig.backgroundImage})`;
      noteContent.style.backgroundSize = 'cover';
      noteContent.style.backgroundPosition = 'center';
    } else {
      noteContent.style.backgroundImage = 'none';
    }
  }
}

async function saveTheme(themeConfig) {
  await chrome.storage.local.set({ [THEME_KEY]: themeConfig });
}

function handleThemePresetClick(e) {
  const preset = e.target.closest('.theme-preset');
  if (!preset) return;
  
  // Don't process custom toggle here
  if (preset.id === 'btn-theme-custom') return;
  
  const themeName = preset.dataset.theme;
  const themeConfig = {
    type: 'preset',
    name: themeName
  };
  
  // Update UI
  document.querySelectorAll('.theme-preset').forEach(p => p.classList.remove('active'));
  preset.classList.add('active');
  
  // Hide custom panel
  document.getElementById('custom-theme-panel').style.display = 'none';
  
  // Apply and save theme
  applyTheme(themeConfig);
  saveTheme(themeConfig);
}

function handleCustomThemeToggle() {
  const customPanel = document.getElementById('custom-theme-panel');
  const customBtn = document.getElementById('btn-theme-custom');
  const isVisible = customPanel.style.display !== 'none';
  
  if (isVisible) {
    customPanel.style.display = 'none';
    customBtn.classList.remove('active');
  } else {
    customPanel.style.display = 'block';
    customBtn.classList.add('active');
    document.querySelectorAll('.theme-preset').forEach(p => {
      if (p.id !== 'btn-theme-custom') p.classList.remove('active');
    });
  }
}

function handleApplyCustomTheme() {
  const bgColor = document.getElementById('custom-bg-color').value;
  const textColor = document.getElementById('custom-text-color').value;
  const bgImageInput = document.getElementById('bg-image-upload');
  
  const themeConfig = {
    type: 'custom',
    backgroundColor: bgColor,
    textColor: textColor
  };
  
  // Handle background image if uploaded
  if (bgImageInput.files && bgImageInput.files[0]) {
    const reader = new FileReader();
    reader.onload = (e) => {
      themeConfig.backgroundImage = e.target.result;
      applyTheme(themeConfig);
      saveTheme(themeConfig);
      showPasteNotification('Custom theme applied!');
    };
    reader.readAsDataURL(bgImageInput.files[0]);
  } else {
    applyTheme(themeConfig);
    saveTheme(themeConfig);
    showPasteNotification('Custom theme applied!');
  }
}

// Font Size Functions
function applyFontSize(size) {
  noteContent.style.fontSize = size + 'px';
}

async function saveFontSize(size) {
  await chrome.storage.local.set({ [FONT_SIZE_KEY]: size });
}

function handleFontSizePresetClick(e) {
  const btn = e.target;
  if (!btn.classList.contains('btn-size-preset')) return;
  
  // Handle custom toggle button
  if (btn.id === 'btn-text-size-custom') {
    const customPanel = document.getElementById('custom-text-size-panel');
    const isVisible = customPanel.style.display !== 'none';
    
    if (isVisible) {
      customPanel.style.display = 'none';
      btn.classList.remove('active');
    } else {
      customPanel.style.display = 'block';
      btn.classList.add('active');
      document.querySelectorAll('.text-size-presets .btn-size-preset').forEach(b => {
        if (b.id !== 'btn-text-size-custom') b.classList.remove('active');
      });
      setTimeout(() => document.getElementById('custom-font-size').focus(), 100);
    }
    return;
  }
  
  // Handle preset buttons
  const size = parseInt(btn.dataset.size);
  
  // Update UI
  document.querySelectorAll('.text-size-presets .btn-size-preset').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  
  // Hide custom panel and clear input
  document.getElementById('custom-text-size-panel').style.display = 'none';
  document.getElementById('custom-font-size').value = '';
  
  // Apply and save font size
  applyFontSize(size);
  saveFontSize(size);
}

function handleApplyCustomFontSize() {
  const sizeInput = document.getElementById('custom-font-size');
  const size = parseInt(sizeInput.value);
  
  if (!size || size < 8 || size > 72) {
    alert('Please enter a valid font size between 8 and 72.');
    return;
  }
  
  // Update UI
  document.querySelectorAll('.text-size-presets .btn-size-preset').forEach(b => b.classList.remove('active'));
  document.getElementById('btn-text-size-custom').classList.add('active');
  
  // Apply and save font size
  applyFontSize(size);
  saveFontSize(size);
  showPasteNotification('Font size updated!');
}

// Export notes
async function exportNotes() {
  // Export as individual TXT files
  await exportAsTXT();
}

// Export notes as individual TXT files
async function exportAsTXT() {
  const noteIds = Object.keys(notes).sort((a, b) => {
    const numA = parseInt(a) || 0;
    const numB = parseInt(b) || 0;
    return numA - numB;
  });
  
  let exportedCount = 0;
  
  for (const noteId of noteIds) {
    const note = notes[noteId];
    if (!note.content && !note.title) continue; // Skip empty notes
    
    // Get category name
    const categoryName = categories[note.category]?.name || 'Uncategorized';
    
    // Determine filename: title if exists, otherwise "Note X"
    let filename;
    if (note.title) {
      // Sanitize title for filename
      filename = note.title.replace(/[<>:"/\\|?*]/g, '_').substring(0, 50);
    } else {
      // Get index within category
      const categoryNotes = Object.entries(notes)
        .filter(([id, n]) => n.category === note.category)
        .sort((a, b) => {
          const numA = parseInt(a[0]) || 0;
          const numB = parseInt(b[0]) || 0;
          return numA - numB;
        });
      const index = categoryNotes.findIndex(([id]) => id === noteId);
      filename = `Note ${index + 1}`;
    }
    
    // Add category prefix to filename
    filename = `${categoryName}_${filename}.txt`;
    
    // Create content with metadata header
    const content = `${note.content}`;
    
    // Create and download file
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    exportedCount++;
    
    // Small delay between downloads
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  if (exportedCount > 0) {
    alert(`Successfully exported ${exportedCount} note(s) as TXT files.`);
  } else {
    alert('No notes to export.');
  }
}

// Export notes as JSON
function exportAsJSON() {
  const data = {
    notes: notes,
    exportDate: new Date().toISOString(),
    version: '1.0'
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `quick-notes-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Import notes
function importNotes(files) {
  if (!files || files.length === 0) return;
  
  const fileList = Array.from(files);
  let importedCount = 0;
  let processedCount = 0;
  
  // Process each file
  fileList.forEach(file => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target.result;
        let noteData = {};
        
        // Check if it's a JSON or TXT file
        if (file.name.endsWith('.json')) {
          // JSON format
          const data = JSON.parse(content);
          if (data.notes && typeof data.notes === 'object') {
            // Import all notes from JSON
            const importedNotes = data.notes;
            const existingIds = Object.keys(notes);
            const maxId = Math.max(0, ...existingIds.map(id => parseInt(id) || 0));
            let nextId = maxId + 1;
            
            for (const [id, note] of Object.entries(importedNotes)) {
              const actualId = notes[id] ? String(nextId++) : id;
              notes[actualId] = {
                name: note.name || `Note ${actualId}`,
                content: note.content || '',
                category: note.category || selectedCategory,
                title: note.title || ''
              };
              importedCount++;
            }
          }
        } else if (file.name.endsWith('.txt')) {
          // TXT format - create a single note
          const existingIds = Object.keys(notes);
          const newId = String(Math.max(0, ...existingIds.map(id => parseInt(id) || 0)) + 1);
          
          // Extract note name from filename (remove extension and category prefix)
          let noteName = file.name.replace(/\.txt$/i, '');
          // Remove category prefix if exists (e.g., "Work_")
          const underscoreIndex = noteName.indexOf('_');
          if (underscoreIndex > 0) {
            noteName = noteName.substring(underscoreIndex + 1);
          }
          
          notes[newId] = {
            name: newId,
            content: content,
            category: selectedCategory,
            title: noteName // Use filename as title
          };
          importedCount++;
        }
        
        processedCount++;
        
        // After all files are processed
        if (processedCount === fileList.length) {
          await saveNotes();
          renderTabs();
          showTab(activeTabId);
          
          if (importedCount > 0) {
            alert(`Successfully imported ${importedCount} note(s) into "${categories[selectedCategory]?.name || 'Uncategorized'}" category.`);
          } else {
            alert('No valid notes found in the selected files.');
          }
        }
      } catch (error) {
        console.error('Error importing file:', file.name, error);
        processedCount++;
        
        if (processedCount === fileList.length) {
          alert('Some files could not be imported. Please check the file format.');
        }
      }
    };
    
    reader.readAsText(file);
  });
}

// Settings Modal Functions
function openSettingsModal() {
  settingsModal.classList.add('show');
  renderCategoryList();
  renderNotesByCategory();
  loadCurrentWindowSize();
  loadCurrentTheme();
  loadCurrentFontSize();
  
  // Add ESC key listener
  document.addEventListener('keydown', handleSettingsEscapeKey);
}

// Load and update theme UI state
async function loadCurrentTheme() {
  const result = await chrome.storage.local.get([THEME_KEY]);
  const theme = result[THEME_KEY];
  
  if (!theme) return;
  
  // Clear all active states
  document.querySelectorAll('.theme-preset').forEach(p => p.classList.remove('active'));
  
  if (theme.type === 'preset') {
    // Find and activate the matching preset button
    const presetBtn = document.querySelector(`.theme-preset[data-theme="${theme.name}"]`);
    if (presetBtn) {
      presetBtn.classList.add('active');
    }
    // Hide custom panel
    document.getElementById('custom-theme-panel').style.display = 'none';
  } else if (theme.type === 'custom') {
    // Activate custom button and show panel
    document.getElementById('btn-theme-custom').classList.add('active');
    document.getElementById('custom-theme-panel').style.display = 'block';
    
    // Set custom values if available
    if (theme.backgroundColor) {
      document.getElementById('custom-bg-color').value = theme.backgroundColor;
    }
    if (theme.textColor) {
      document.getElementById('custom-text-color').value = theme.textColor;
    }
  }
}

// Load and update font size UI state
async function loadCurrentFontSize() {
  const result = await chrome.storage.local.get([FONT_SIZE_KEY]);
  const fontSize = result[FONT_SIZE_KEY];
  
  if (!fontSize) return;
  
  // Clear all active states
  document.querySelectorAll('.text-size-presets .btn-size-preset').forEach(b => b.classList.remove('active'));
  
  // Check if matches any preset by data-size attribute
  const presetBtn = document.querySelector(`.text-size-presets .btn-size-preset[data-size="${fontSize}"]`);
  
  if (presetBtn) {
    // Match a preset
    presetBtn.classList.add('active');
    // Hide custom panel
    document.getElementById('custom-text-size-panel').style.display = 'none';
  } else {
    // Custom size
    document.getElementById('btn-text-size-custom').classList.add('active');
    document.getElementById('custom-text-size-panel').style.display = 'block';
    document.getElementById('custom-font-size').value = fontSize;
  }
}

async function loadCurrentWindowSize() {
  const result = await chrome.storage.local.get([WINDOW_SIZE_KEY]);
  const windowSize = result[WINDOW_SIZE_KEY];
  
  if (!windowSize || !windowSize.width || !windowSize.height) return;
  
  const savedWidth = windowSize.width;
  const savedHeight = windowSize.height;
  
  // Validate that values are numbers
  if (isNaN(savedWidth) || isNaN(savedHeight)) return;
  
  // Check if matches any preset
  let matchedPreset = false;
  sizePresets.forEach(btn => {
    // Skip the custom toggle button
    if (btn.id === 'btn-custom-toggle') return;
    
    const width = parseInt(btn.dataset.width);
    const height = parseInt(btn.dataset.height);
    
    if (savedWidth === width && savedHeight === height) {
      btn.classList.add('active');
      matchedPreset = true;
      // Hide custom panel if matched a preset
      customSizePanel.style.display = 'none';
      btnCustomToggle.classList.remove('active');
    } else {
      btn.classList.remove('active');
    }
  });
  
  // If doesn't match preset, show custom values and panel
  if (!matchedPreset) {
    // Ensure values are valid before setting
    if (savedWidth !== undefined && savedWidth !== null && savedWidth !== 'undefined') {
      customWidth.value = savedWidth;
    }
    if (savedHeight !== undefined && savedHeight !== null && savedHeight !== 'undefined') {
      customHeight.value = savedHeight;
    }
    customSizePanel.style.display = 'flex';
    btnCustomToggle.classList.add('active');
  } else {
    customWidth.value = '';
    customHeight.value = '';
  }
}

function closeSettingsModal() {
  settingsModal.classList.remove('show');
  
  // Remove ESC key listener
  document.removeEventListener('keydown', handleSettingsEscapeKey);
}

function handleSettingsEscapeKey(e) {
  if (e.key === 'Escape' || e.keyCode === 27) {
    e.preventDefault();
    e.stopPropagation();
    closeSettingsModal();
  }
}

function renderCategoryList() {
  categoryList.innerHTML = '';
  
  // Get sorted category IDs (by order if exists, otherwise alphabetically)
  const catIds = Object.keys(categories).sort((a, b) => {
    const orderA = categories[a].order !== undefined ? categories[a].order : 999;
    const orderB = categories[b].order !== undefined ? categories[b].order : 999;
    if (orderA !== orderB) return orderA - orderB;
    return a.localeCompare(b);
  });
  
  catIds.forEach(catId => {
    const item = document.createElement('div');
    item.className = 'category-item';
    item.draggable = true;
    item.dataset.categoryId = catId;
    
    // Drag handle
    const dragHandle = document.createElement('span');
    dragHandle.className = 'drag-handle';
    dragHandle.innerHTML = '☰';
    dragHandle.title = 'Drag to reorder';
    item.appendChild(dragHandle);
    
    const nameSpan = document.createElement('span');
    nameSpan.textContent = categories[catId].name;
    nameSpan.className = 'category-name';
    
    item.appendChild(nameSpan);
    
    // Action buttons container
    const actionsDiv = document.createElement('div');
    actionsDiv.style.display = 'flex';
    actionsDiv.style.gap = '6px';
    
    // Edit button (for all categories)
    const editBtn = document.createElement('button');
    editBtn.className = 'btn-edit-category';
    editBtn.innerHTML = '✎';
    editBtn.title = 'Rename category';
    editBtn.addEventListener('click', () => openRenameCategoryModal(catId));
    actionsDiv.appendChild(editBtn);
    
    // Delete button - show for all categories if there's more than one
    const totalCategories = catIds.length;
    
    if (totalCategories > 1) {
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'btn-delete-category';
      deleteBtn.innerHTML = '×';
      
      // Check if category has notes
      const hasNotes = Object.values(notes).some(note => note.category === catId);
      
      if (hasNotes) {
        deleteBtn.disabled = true;
        deleteBtn.style.opacity = '0.4';
        deleteBtn.style.cursor = 'not-allowed';
        
        // Count notes in this category
        const noteCount = Object.values(notes).filter(note => note.category === catId).length;
        const tooltipText = `Cannot delete: This category contains ${noteCount} note(s). Please move or delete all notes first.`;
        
        // Add custom tooltip
        deleteBtn.addEventListener('mouseenter', (e) => showCustomTooltip(e, tooltipText));
        deleteBtn.addEventListener('mouseleave', hideCustomTooltip);
        deleteBtn.addEventListener('mousemove', (e) => updateTooltipPosition(e));
      } else {
        deleteBtn.addEventListener('click', () => deleteCategory(catId));
      }
      
      actionsDiv.appendChild(deleteBtn);
    }
    
    item.appendChild(actionsDiv);
    categoryList.appendChild(item);
  });
  
  // Add drag and drop event listeners
  setupDragAndDrop();
}

// Drag and Drop functionality for categories
let draggedItem = null;

function setupDragAndDrop() {
  const items = categoryList.querySelectorAll('.category-item');
  
  items.forEach(item => {
    item.addEventListener('dragstart', handleDragStart);
    item.addEventListener('dragover', handleDragOver);
    item.addEventListener('drop', handleDrop);
    item.addEventListener('dragend', handleDragEnd);
    item.addEventListener('dragenter', handleDragEnter);
    item.addEventListener('dragleave', handleDragLeave);
  });
}

function handleDragStart(e) {
  draggedItem = this;
  this.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/html', this.innerHTML);
}

function handleDragOver(e) {
  if (e.preventDefault) {
    e.preventDefault();
  }
  e.dataTransfer.dropEffect = 'move';
  return false;
}

function handleDragEnter(e) {
  if (this !== draggedItem) {
    this.classList.add('drag-over');
  }
}

function handleDragLeave(e) {
  this.classList.remove('drag-over');
}

function handleDrop(e) {
  if (e.stopPropagation) {
    e.stopPropagation();
  }
  
  if (draggedItem !== this) {
    // Get category IDs
    const draggedId = draggedItem.dataset.categoryId;
    const targetId = this.dataset.categoryId;
    
    // Reorder categories
    reorderCategories(draggedId, targetId);
  }
  
  return false;
}

function handleDragEnd(e) {
  this.classList.remove('dragging');
  const items = categoryList.querySelectorAll('.category-item');
  items.forEach(item => item.classList.remove('drag-over'));
}

async function reorderCategories(draggedId, targetId) {
  // Get all category IDs in current order
  const catIds = Object.keys(categories).sort((a, b) => {
    const orderA = categories[a].order !== undefined ? categories[a].order : 999;
    const orderB = categories[b].order !== undefined ? categories[b].order : 999;
    if (orderA !== orderB) return orderA - orderB;
    return a.localeCompare(b);
  });
  
  // Find indices
  const draggedIndex = catIds.indexOf(draggedId);
  const targetIndex = catIds.indexOf(targetId);
  
  if (draggedIndex === -1 || targetIndex === -1) return;
  
  // Remove dragged item and insert at target position
  catIds.splice(draggedIndex, 1);
  catIds.splice(targetIndex, 0, draggedId);
  
  // Update order property for all categories
  catIds.forEach((catId, index) => {
    categories[catId].order = index;
  });
  
  // Save and re-render
  await saveCategories();
  renderCategoryList();
  renderTabs(); // Update main interface
}

// Drag and Drop functionality for notes
let draggedNoteItem = null;

function setupNoteDragAndDrop() {
  const tabsContainer = document.querySelector('.notes-row');
  if (!tabsContainer) return;
  
  const tabs = tabsContainer.querySelectorAll('.tab');
  
  tabs.forEach(tab => {
    // Remove existing listeners to prevent duplicates
    tab.removeEventListener('dragstart', handleNoteDragStart);
    tab.removeEventListener('dragover', handleNoteDragOver);
    tab.removeEventListener('drop', handleNoteDrop);
    tab.removeEventListener('dragend', handleNoteDragEnd);
    tab.removeEventListener('dragenter', handleNoteDragEnter);
    tab.removeEventListener('dragleave', handleNoteDragLeave);
    
    // Add new listeners
    tab.addEventListener('dragstart', handleNoteDragStart);
    tab.addEventListener('dragover', handleNoteDragOver);
    tab.addEventListener('drop', handleNoteDrop);
    tab.addEventListener('dragend', handleNoteDragEnd);
    tab.addEventListener('dragenter', handleNoteDragEnter);
    tab.addEventListener('dragleave', handleNoteDragLeave);
  });
}

function handleNoteDragStart(e) {
  draggedNoteItem = this;
  this.classList.add('dragging-note');
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', this.dataset.id);
  
  // Add a slight delay to show the dragging state
  setTimeout(() => {
    this.style.opacity = '0.5';
  }, 0);
}

function handleNoteDragOver(e) {
  if (e.preventDefault) {
    e.preventDefault();
  }
  e.dataTransfer.dropEffect = 'move';
  return false;
}

function handleNoteDragEnter(e) {
  e.preventDefault();
  if (this !== draggedNoteItem) {
    this.classList.add('drag-over-note');
  }
}

function handleNoteDragLeave(e) {
  this.classList.remove('drag-over-note');
}

function handleNoteDrop(e) {
  if (e.stopPropagation) {
    e.stopPropagation();
  }
  
  if (draggedNoteItem !== this) {
    // Get note IDs
    const draggedId = draggedNoteItem.dataset.id;
    const targetId = this.dataset.id;
    
    console.log('Dropping note:', draggedId, 'at position of:', targetId);
    
    // Reorder notes
    reorderNotes(draggedId, targetId);
  }
  
  return false;
}

function handleNoteDragEnd(e) {
  this.classList.remove('dragging-note');
  this.style.opacity = '1';
  const tabs = document.querySelectorAll('.tab');
  tabs.forEach(tab => tab.classList.remove('drag-over-note'));
  draggedNoteItem = null;
}

async function reorderNotes(draggedId, targetId) {
  // Get all notes in current category sorted by order
  const categoryNotes = Object.entries(notes)
    .filter(([id, note]) => note.category === selectedCategory)
    .sort((a, b) => {
      const orderA = a[1].order !== undefined ? a[1].order : 999;
      const orderB = b[1].order !== undefined ? b[1].order : 999;
      if (orderA !== orderB) return orderA - orderB;
      const numA = parseInt(a[0]) || 0;
      const numB = parseInt(b[0]) || 0;
      return numA - numB;
    });
  
  const noteIds = categoryNotes.map(([id]) => id);
  
  // Find indices
  const draggedIndex = noteIds.indexOf(draggedId);
  const targetIndex = noteIds.indexOf(targetId);
  
  if (draggedIndex === -1 || targetIndex === -1) return;
  
  // Remove dragged item and insert at target position
  noteIds.splice(draggedIndex, 1);
  noteIds.splice(targetIndex, 0, draggedId);
  
  // Update order property for all notes in this category
  noteIds.forEach((noteId, index) => {
    notes[noteId].order = index;
  });
  
  // Save and re-render
  await saveNotes();
  renderTabs();
}

function renderNotesByCategory() {
  notesByCategory.innerHTML = '';
  
  // Get sorted category IDs
  const catIds = Object.keys(categories).sort((a, b) => {
    const orderA = categories[a].order !== undefined ? categories[a].order : 999;
    const orderB = categories[b].order !== undefined ? categories[b].order : 999;
    if (orderA !== orderB) return orderA - orderB;
    return a.localeCompare(b);
  });
  
  catIds.forEach(catId => {
    // Get notes for this category
    const categoryNotes = Object.entries(notes)
      .filter(([id, note]) => note.category === catId)
      .sort((a, b) => {
        const orderA = a[1].order !== undefined ? a[1].order : 999;
        const orderB = b[1].order !== undefined ? b[1].order : 999;
        if (orderA !== orderB) return orderA - orderB;
        const numA = parseInt(a[0]) || 0;
        const numB = parseInt(b[0]) || 0;
        return numA - numB;
      });
    
    // Category container
    const categoryContainer = document.createElement('div');
    categoryContainer.className = 'category-notes-container';
    categoryContainer.dataset.categoryId = catId;
    
    // Category header
    const categoryHeader = document.createElement('div');
    categoryHeader.className = 'category-notes-header';
    categoryHeader.textContent = `${categories[catId].name} (${categoryNotes.length})`;
    categoryContainer.appendChild(categoryHeader);
    
    // Notes list
    const notesList = document.createElement('div');
    notesList.className = 'category-notes-list';
    
    if (categoryNotes.length === 0) {
      // Show empty state
      const emptyMsg = document.createElement('div');
      emptyMsg.className = 'empty-category-notes';
      emptyMsg.textContent = 'No notes in this category';
      notesList.appendChild(emptyMsg);
    } else {
      categoryNotes.forEach(([noteId, note], index) => {
        const noteItem = document.createElement('div');
        noteItem.className = 'category-note-item';
        noteItem.draggable = true;
        noteItem.dataset.noteId = noteId;
        
        // Drag handle
        const dragHandle = document.createElement('span');
        dragHandle.className = 'drag-handle';
        dragHandle.innerHTML = '☰';
        dragHandle.title = 'Drag to reorder';
        noteItem.appendChild(dragHandle);
        
        // Note name
        const noteName = document.createElement('span');
        noteName.className = 'note-name';
        noteName.textContent = note.title || String(index + 1);
        noteItem.appendChild(noteName);
        
        notesList.appendChild(noteItem);
      });
      
      // Add drag and drop event listeners
      setupCategoryNoteDragAndDrop(catId);
    }
    
    categoryContainer.appendChild(notesList);
    notesByCategory.appendChild(categoryContainer);
  });
}

// Drag and Drop functionality for notes within categories in Settings
let draggedCategoryNote = null;

function setupCategoryNoteDragAndDrop(categoryId) {
  const container = document.querySelector(`.category-notes-container[data-category-id="${categoryId}"]`);
  if (!container) return;
  
  const notesList = container.querySelector('.category-notes-list');
  if (!notesList) return;
  
  const noteItems = notesList.querySelectorAll('.category-note-item');
  
  noteItems.forEach(item => {
    item.addEventListener('dragstart', handleCategoryNoteDragStart);
    item.addEventListener('dragover', handleCategoryNoteDragOver);
    item.addEventListener('drop', handleCategoryNoteDrop);
    item.addEventListener('dragend', handleCategoryNoteDragEnd);
    item.addEventListener('dragenter', handleCategoryNoteDragEnter);
    item.addEventListener('dragleave', handleCategoryNoteDragLeave);
  });
}

function handleCategoryNoteDragStart(e) {
  draggedCategoryNote = this;
  this.classList.add('dragging-category-note');
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', this.dataset.noteId);
  
  setTimeout(() => {
    this.style.opacity = '0.5';
  }, 0);
}

function handleCategoryNoteDragOver(e) {
  if (e.preventDefault) {
    e.preventDefault();
  }
  e.dataTransfer.dropEffect = 'move';
  return false;
}

function handleCategoryNoteDragEnter(e) {
  e.preventDefault();
  if (this !== draggedCategoryNote) {
    this.classList.add('drag-over-category-note');
  }
}

function handleCategoryNoteDragLeave(e) {
  this.classList.remove('drag-over-category-note');
}

function handleCategoryNoteDrop(e) {
  if (e.stopPropagation) {
    e.stopPropagation();
  }
  
  if (draggedCategoryNote !== this) {
    const draggedId = draggedCategoryNote.dataset.noteId;
    const targetId = this.dataset.noteId;
    const container = this.closest('.category-notes-container');
    const categoryId = container.dataset.categoryId;
    
    reorderNotesInCategory(draggedId, targetId, categoryId);
  }
  
  return false;
}

function handleCategoryNoteDragEnd(e) {
  this.classList.remove('dragging-category-note');
  this.style.opacity = '1';
  const items = document.querySelectorAll('.category-note-item');
  items.forEach(item => item.classList.remove('drag-over-category-note'));
  draggedCategoryNote = null;
}

async function reorderNotesInCategory(draggedId, targetId, categoryId) {
  // Get all notes in the category sorted by order
  const categoryNotes = Object.entries(notes)
    .filter(([id, note]) => note.category === categoryId)
    .sort((a, b) => {
      const orderA = a[1].order !== undefined ? a[1].order : 999;
      const orderB = b[1].order !== undefined ? b[1].order : 999;
      if (orderA !== orderB) return orderA - orderB;
      const numA = parseInt(a[0]) || 0;
      const numB = parseInt(b[0]) || 0;
      return numA - numB;
    });
  
  const noteIds = categoryNotes.map(([id]) => id);
  
  const draggedIndex = noteIds.indexOf(draggedId);
  const targetIndex = noteIds.indexOf(targetId);
  
  if (draggedIndex === -1 || targetIndex === -1) return;
  
  noteIds.splice(draggedIndex, 1);
  noteIds.splice(targetIndex, 0, draggedId);
  
  noteIds.forEach((noteId, index) => {
    notes[noteId].order = index;
  });
  
  await saveNotes();
  renderNotesByCategory();
}

async function addCategory() {
  const name = newCategoryName.value.trim();
  if (!name) return;
  
  // Generate a unique category ID
  const catId = 'cat_' + Date.now();
  
  // Set order to be after all existing categories
  const maxOrder = Math.max(-1, ...Object.values(categories).map(c => c.order !== undefined ? c.order : -1));
  categories[catId] = { name, order: maxOrder + 1 };
  
  await saveCategories();
  newCategoryName.value = '';
  
  renderCategoryList();
  renderNotesByCategory();
  renderTabs(); // Update main interface tabs
}

async function deleteCategory(catId) {
  // Ensure at least one category remains
  const totalCategories = Object.keys(categories).length;
  if (totalCategories <= 1) {
    alert('Cannot delete the last category. At least one category must remain.');
    return;
  }
  
  // Double-check that category is empty
  const hasNotes = Object.values(notes).some(note => note.category === catId);
  if (hasNotes) {
    alert(`Cannot delete "${categories[catId].name}" because it still contains notes. Please move or delete all notes in this category first.`);
    return;
  }
  
  delete categories[catId];
  
  // If we deleted the selected category, switch to another one
  if (selectedCategory === catId) {
    const remainingCatIds = Object.keys(categories);
    selectedCategory = remainingCatIds[0] || 'uncategorized';
    
    // If no categories remain (shouldn't happen due to check above), create uncategorized
    if (!selectedCategory || !categories[selectedCategory]) {
      categories['uncategorized'] = { name: 'Uncategorized' };
      selectedCategory = 'uncategorized';
      await saveCategories();
    }
    
    // Select the first note in the new category
    const categoryNotes = Object.entries(notes)
      .filter(([id, note]) => note.category === selectedCategory)
      .sort((a, b) => {
        const orderA = a[1].order !== undefined ? a[1].order : 999;
        const orderB = b[1].order !== undefined ? b[1].order : 999;
        if (orderA !== orderB) return orderA - orderB;
        const numA = parseInt(a[0]) || 0;
        const numB = parseInt(b[0]) || 0;
        return numA - numB;
      });
    
    if (categoryNotes.length > 0) {
      activeTabId = categoryNotes[0][0];
      await chrome.storage.local.set({ 
        activeTabId: activeTabId,
        selectedCategory: selectedCategory 
      });
      
      // Re-enable text area
      noteContent.contentEditable = 'true';
      noteContent.style.opacity = '1';
      noteContent.style.cursor = '';
    } else {
      // No notes in this category, disable text area
      noteContent.innerHTML = '';
      noteContent.contentEditable = 'false';
      noteContent.style.opacity = '0.5';
      noteContent.style.cursor = 'not-allowed';
      activeTabId = null;
      await chrome.storage.local.set({ 
        activeTabId: null,
        selectedCategory: selectedCategory 
      });
    }
  }
  
  await saveCategories();
  
  renderCategoryList();
  renderNotesByCategory();
  renderTabs();
}

// Rename Category Modal Functions
function openRenameCategoryModal(catId) {
  renameCategoryId.value = catId;
  renameCategoryInput.value = categories[catId].name;
  renameCategoryModal.classList.add('show');
  
  // Focus and select the input text
  setTimeout(() => {
    renameCategoryInput.focus();
    renameCategoryInput.select();
  }, 100);
}

function closeRenameCategoryModal() {
  renameCategoryModal.classList.remove('show');
  renameCategoryId.value = '';
  renameCategoryInput.value = '';
}

async function confirmRenameCategory() {
  const catId = renameCategoryId.value;
  const newName = renameCategoryInput.value.trim();
  
  if (!catId || !newName) {
    closeRenameCategoryModal();
    return;
  }
  
  categories[catId].name = newName;
  await saveCategories();
  
  closeRenameCategoryModal();
  renderCategoryList();
  renderNotesByCategory();
  renderTabs();
}

async function assignNoteToCategory(noteId, catId) {
  notes[noteId].category = catId;
  await saveNotes();
  
  // Re-render the entire note assignment tree
  renderNotesByCategory();
  
  // Also update the main tabs view
  renderTabs();
}


function selectCategory(catId) {
  selectedCategory = catId;
  renderTabs();
  
  // Auto-select the first note in the category
  const categoryNotes = Object.entries(notes)
    .filter(([id, note]) => note.category === catId)
    .sort((a, b) => {
      const orderA = a[1].order !== undefined ? a[1].order : 999;
      const orderB = b[1].order !== undefined ? b[1].order : 999;
      if (orderA !== orderB) return orderA - orderB;
      const numA = parseInt(a[0]) || 0;
      const numB = parseInt(b[0]) || 0;
      return numA - numB;
    });
  
  if (categoryNotes.length > 0) {
    // Re-enable text area
    noteContent.contentEditable = 'true';
    noteContent.style.opacity = '1';
    noteContent.style.cursor = '';
    
    const firstNoteId = categoryNotes[0][0];
    switchTab(firstNoteId);
  } else {
    // No notes in this category, clear and disable text area
    noteContent.innerHTML = '';
    noteContent.contentEditable = 'false';
    noteContent.style.opacity = '0.5';
    noteContent.style.cursor = 'not-allowed';
    activeTabId = null;
  }
}

// Confirm Delete Modal Functions
function showConfirmDialog(message, onConfirm) {
  confirmDeleteMessage.innerHTML = message;
  confirmDeleteModal.classList.add('show');
  pendingDeleteAction = onConfirm;
  
  // Focus on cancel button for safety
  setTimeout(() => {
    btnCancelDelete.focus();
  }, 100);
}

function closeConfirmDialog() {
  confirmDeleteModal.classList.remove('show');
  pendingDeleteAction = null;
}

function executePendingDelete() {
  if (pendingDeleteAction) {
    pendingDeleteAction();
    closeConfirmDialog();
  }
}

// Window Size Functions
function applyWindowSize(width, height) {
  // Set both html and body to ensure proper sizing
  document.documentElement.style.width = width + 'px';
  document.documentElement.style.minWidth = width + 'px';
  document.body.style.width = width + 'px';
  document.body.style.minWidth = width + 'px';
  
  document.documentElement.style.height = height + 'px';
  document.documentElement.style.minHeight = height + 'px';
  document.body.style.height = height + 'px';
  document.body.style.minHeight = height + 'px';
  
  // Update the textarea/container to fit the new window
  const noteContent = document.getElementById('note-content');
  if (noteContent) {
    // Recalculate based on actual layout
    noteContent.style.minHeight = (height - 120) + 'px';
  }
}

async function setWindowSize(width, height) {
  // Allow user to set any value, but validate minimums
  width = Math.max(300, width);
  height = Math.max(400, height);
  
  applyWindowSize(width, height);
  
  // Save to storage (save the user's intended size)
  await chrome.storage.local.set({
    [WINDOW_SIZE_KEY]: { width, height }
  });
  
  // Update UI
  loadCurrentWindowSize();
}

function handleSizePresetClick(e) {
  const btn = e.target;
  
  // Handle custom toggle button
  if (btn.id === 'btn-custom-toggle') {
    const isVisible = customSizePanel.style.display !== 'none';
    
    if (isVisible) {
      // Hide custom panel
      customSizePanel.style.display = 'none';
      btn.classList.remove('active');
    } else {
      // Show custom panel
      customSizePanel.style.display = 'flex';
      btn.classList.add('active');
      
      // Remove active from other presets
      sizePresets.forEach(b => {
        if (b.id !== 'btn-custom-toggle') {
          b.classList.remove('active');
        }
      });
      
      // Focus on width input
      setTimeout(() => customWidth.focus(), 100);
    }
    return;
  }
  
  const width = parseInt(btn.dataset.width);
  const height = parseInt(btn.dataset.height);
  
  // Remove active class from all presets
  sizePresets.forEach(b => b.classList.remove('active'));
  
  // Add active class to clicked button
  btn.classList.add('active');
  
  // Hide custom panel and clear inputs
  customSizePanel.style.display = 'none';
  customWidth.value = '';
  customHeight.value = '';
  
  setWindowSize(width, height);
}

// Custom Tooltip Functions
let tooltipElement = null;

function showCustomTooltip(event, text) {
  if (!tooltipElement) {
    tooltipElement = document.createElement('div');
    tooltipElement.className = 'custom-tooltip';
    document.body.appendChild(tooltipElement);
  }
  
  tooltipElement.textContent = text;
  tooltipElement.classList.add('show');
  updateTooltipPosition(event);
}

function updateTooltipPosition(event) {
  if (!tooltipElement) return;
  
  const offset = 10;
  const tooltipRect = tooltipElement.getBoundingClientRect();
  
  let left = event.clientX + offset;
  let top = event.clientY - tooltipRect.height - offset;
  
  // Ensure tooltip stays within viewport
  if (left + tooltipRect.width > window.innerWidth) {
    left = window.innerWidth - tooltipRect.width - offset;
  }
  
  if (top < 0) {
    top = event.clientY + offset;
  }
  
  tooltipElement.style.left = left + 'px';
  tooltipElement.style.top = top + 'px';
}

function hideCustomTooltip() {
  if (tooltipElement) {
    tooltipElement.classList.remove('show');
  }
}

// Event Listeners
btnAdd.addEventListener('click', addTab);
btnDelete.addEventListener('click', confirmDeleteNote);

noteContent.addEventListener('input', () => {
  saveCurrentContent();
});

// Handle paste event for images
noteContent.addEventListener('paste', (e) => {
  const items = e.clipboardData?.items;
  if (!items) return;
  
  // Check if clipboard contains an image
  for (let i = 0; i < items.length; i++) {
    if (items[i].type.indexOf('image') !== -1) {
      e.preventDefault();
      
      const blob = items[i].getAsFile();
      
      // Check image size before processing (limit to 2MB per image)
      const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB
      if (blob.size > MAX_IMAGE_SIZE) {
        alert(`⚠️ Image Too Large!\n\nImage size: ${formatBytes(blob.size)}\nMaximum allowed: ${formatBytes(MAX_IMAGE_SIZE)}\n\nPlease resize the image or take a smaller screenshot.`);
        return;
      }
      
      const reader = new FileReader();
      
      reader.onload = (event) => {
        const base64Image = event.target.result;
        
        // Create image element
        const img = document.createElement('img');
        img.src = base64Image;
        img.style.maxWidth = '100%';
        img.alt = 'Pasted image';
        
        // Insert at cursor position
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          range.deleteContents();
          range.insertNode(img);
          
          // Move cursor after the image
          range.setStartAfter(img);
          range.setEndAfter(img);
          selection.removeAllRanges();
          selection.addRange(range);
          
          // Add a line break after image
          const br = document.createElement('br');
          range.insertNode(br);
          range.setStartAfter(br);
          range.setEndAfter(br);
          selection.removeAllRanges();
          selection.addRange(range);
        }
        
        // Save the content
        saveCurrentContent();
        
        // Show notification with image size
        showPasteNotification(`Image pasted (${formatBytes(blob.size)})`);
      };
      
      reader.readAsDataURL(blob);
      break;
    }
  }
});

btnExport.addEventListener('click', exportNotes);

btnImport.addEventListener('click', () => {
  fileInput.click();
});

fileInput.addEventListener('change', (e) => {
  if (e.target.files && e.target.files.length > 0) {
    importNotes(e.target.files);
    e.target.value = ''; // Reset file input
  }
});

btnSettings.addEventListener('click', openSettingsModal);
modalClose.addEventListener('click', closeSettingsModal);
btnAddCategory.addEventListener('click', addCategory);

// Visit website button
btnVisitWebsite.addEventListener('click', () => {
  window.open('https://zhishaofei3.github.io/ZapJot/', '_blank');
});

// Insert current date and time
function insertDateTime() {
  const now = new Date();
  const dateTimeStr = now.toLocaleString();
  
  // Insert at cursor position or at the end
  const selection = window.getSelection();
  if (selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);
    range.deleteContents();
    range.insertNode(document.createTextNode(dateTimeStr));
    range.collapse(false);
  } else {
    noteContent.innerHTML += dateTimeStr;
  }
  
  saveCurrentContent();
  showPasteNotification('Date & Time inserted');
}

// Insert current tab title and URL
async function insertTabUrl() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) {
      const textToInsert = `[${tab.title}](${tab.url})`;
      
      // Insert at cursor position or at the end
      const selection = window.getSelection();
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        range.insertNode(document.createTextNode(textToInsert));
        range.collapse(false);
      } else {
        noteContent.innerHTML += textToInsert;
      }
      
      saveCurrentContent();
      showPasteNotification('Tab URL inserted');
    }
  } catch (error) {
    console.error('Error getting tab info:', error);
    alert('Could not get current tab information');
  }
}

btnInsertTime.addEventListener('click', insertDateTime);
btnInsertUrl.addEventListener('click', insertTabUrl);

// Insert current date only (locale format)
function insertDateOnly() {
  const now = new Date();
  // Use locale-specific date format
  const dateStr = now.toLocaleDateString();
  
  // Insert at cursor position or at the end
  const selection = window.getSelection();
  if (selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);
    range.deleteContents();
    range.insertNode(document.createTextNode(dateStr));
    range.collapse(false);
  } else {
    noteContent.innerHTML += dateStr;
  }
  
  saveCurrentContent();
  showPasteNotification('Date inserted');
}

btnInsertDate.addEventListener('click', insertDateOnly);

// Theme event listeners
document.querySelectorAll('.theme-preset').forEach(preset => {
  preset.addEventListener('click', handleThemePresetClick);
});

document.getElementById('btn-theme-custom').addEventListener('click', handleCustomThemeToggle);
document.getElementById('btn-apply-theme').addEventListener('click', handleApplyCustomTheme);
document.getElementById('btn-cancel-theme').addEventListener('click', () => {
  document.getElementById('custom-theme-panel').style.display = 'none';
  document.getElementById('btn-theme-custom').classList.remove('active');
});

// Font size event listeners
document.querySelectorAll('.text-size-presets .btn-size-preset').forEach(btn => {
  btn.addEventListener('click', handleFontSizePresetClick);
});

document.getElementById('btn-apply-font-size').addEventListener('click', handleApplyCustomFontSize);

// Close modal when clicking outside
settingsModal.addEventListener('click', (e) => {
  if (e.target === settingsModal) {
    closeSettingsModal();
  }
});

// Allow Enter key to add category
newCategoryName.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    addCategory();
  }
});

// Rename category modal event listeners
renameModalClose.addEventListener('click', closeRenameCategoryModal);
btnCancelRename.addEventListener('click', closeRenameCategoryModal);
btnConfirmRename.addEventListener('click', confirmRenameCategory);

// Close rename modal when clicking outside
renameCategoryModal.addEventListener('click', (e) => {
  if (e.target === renameCategoryModal) {
    closeRenameCategoryModal();
  }
});

// Allow Enter key to confirm rename
renameCategoryInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    confirmRenameCategory();
  }
});

// Allow Escape key to cancel rename
renameCategoryInput.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeRenameCategoryModal();
  }
});

// Confirm delete modal event listeners
confirmDeleteClose.addEventListener('click', closeConfirmDialog);
btnCancelDelete.addEventListener('click', closeConfirmDialog);
btnConfirmDelete.addEventListener('click', executePendingDelete);

// Close confirm modal when clicking outside
confirmDeleteModal.addEventListener('click', (e) => {
  if (e.target === confirmDeleteModal) {
    closeConfirmDialog();
  }
});

// Allow Escape key to close confirm dialog
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && confirmDeleteModal.classList.contains('show')) {
    closeConfirmDialog();
  }
});

// Set title modal event listeners
setTitleClose.addEventListener('click', closeSetTitleModal);
btnCancelTitle.addEventListener('click', closeSetTitleModal);
btnConfirmTitle.addEventListener('click', confirmSetTitle);

// Close title modal when clicking outside
setTitleModal.addEventListener('click', (e) => {
  if (e.target === setTitleModal) {
    closeSetTitleModal();
  }
});

// Allow Enter key to confirm title
setTitleInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    confirmSetTitle();
  }
});

// Allow Escape key to close title modal
setTitleInput.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeSetTitleModal();
  }
});

// Window size event listeners
sizePresets.forEach(btn => {
  btn.addEventListener('click', handleSizePresetClick);
});

btnApplyCustomSize.addEventListener('click', () => {
  const width = parseInt(customWidth.value);
  const height = parseInt(customHeight.value);
  
  if (!width || !height) {
    alert('Please enter both width and height');
    return;
  }
  
  // Remove active class from all presets
  sizePresets.forEach(btn => btn.classList.remove('active'));
  
  setWindowSize(width, height);
});

// Initialize on load
init();
