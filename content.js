// content.js

(function () {
  'use strict';

  let sidebar = null;
  let observer = null;
  let debounceTimer = null;

  // Initialize the extension
  function init() {
    createSidebar();
    scanMessages();
    setupObserver();
  }

  // Create the sidebar UI
  function createSidebar() {
    if (document.getElementById('chatgpt-outline-sidebar')) return;

    sidebar = document.createElement('div');
    sidebar.id = 'chatgpt-outline-sidebar';
    sidebar.classList.add('collapsed'); // Default to collapsed

    const header = document.createElement('h2');
    header.textContent = 'Chat Outline';
    sidebar.appendChild(header);

    // Create Resize Handle
    const resizer = document.createElement('div');
    resizer.id = 'chatgpt-outline-resizer';
    sidebar.appendChild(resizer);

    const listContainer = document.createElement('div');
    listContainer.id = 'chatgpt-outline-list';
    sidebar.appendChild(listContainer);

    document.body.appendChild(sidebar);

    // Resize Logic
    let isResizing = false;
    let startX, startWidth;
    let isClick = true; // Track if it's a click or drag

    resizer.addEventListener('mousedown', (e) => {
      isResizing = true;
      isClick = true; // Reset click flag
      startX = e.clientX;
      startWidth = parseInt(window.getComputedStyle(sidebar).width, 10);
      resizer.classList.add('resizing');
      document.body.style.cursor = 'col-resize';
      e.preventDefault(); // Prevent text selection
    });

    document.addEventListener('mousemove', (e) => {
      if (!isResizing) return;

      // If moved more than a few pixels, it's a drag
      if (Math.abs(e.clientX - startX) > 3) {
        isClick = false;
      }

      // Calculate new width (right-aligned, so dragging left increases width)
      const width = startWidth + (startX - e.clientX);

      if (width > 200 && width < 800) { // Min/Max constraints
        sidebar.style.width = `${width}px`;
        if (document.body.classList.contains('chatgpt-outline-open')) {
          document.body.style.paddingRight = `${width}px`;
        }
      }
    });

    document.addEventListener('mouseup', () => {
      if (isResizing) {
        isResizing = false;
        resizer.classList.remove('resizing');
        document.body.style.cursor = '';

        // Handle Click to Collapse
        if (isClick) {
          sidebar.classList.add('collapsed');
          document.body.classList.remove('chatgpt-outline-open');
          document.body.style.paddingRight = '';

          const expandBtn = document.getElementById('chatgpt-outline-expand-btn');
          if (expandBtn) expandBtn.style.display = 'flex';
        }
      }
    });

    // Create Floating Expand Button
    const expandBtn = document.createElement('button');
    expandBtn.id = 'chatgpt-outline-expand-btn';
    expandBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>'; // Chevron left
    expandBtn.title = 'Show Outline (Drag to move)';
    // Set initial top to 50% via JS to play nice with drag logic which uses style.top
    expandBtn.style.top = '50%';
    expandBtn.style.transform = 'translateY(-50%)'; // Center it initially

    // Drag Logic for Expand Button
    let isBtnDragging = false;
    let btnStartY, btnStartTop;
    let isBtnClick = true;

    expandBtn.addEventListener('mousedown', (e) => {
      isBtnDragging = true;
      isBtnClick = true;
      btnStartY = e.clientY;
      // Get current top value
      const rect = expandBtn.getBoundingClientRect();
      btnStartTop = rect.top;

      // Remove transform centering when starting to drag to rely on absolute top
      if (expandBtn.style.transform) {
        expandBtn.style.transform = 'none';
        expandBtn.style.top = `${btnStartTop}px`;
      }

      expandBtn.style.cursor = 'grabbing';
      e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
      if (!isBtnDragging) return;

      const deltaY = e.clientY - btnStartY;
      if (Math.abs(deltaY) > 3) {
        isBtnClick = false;
      }

      let newTop = btnStartTop + deltaY;

      // Constraints (keep within window)
      const maxTop = window.innerHeight - expandBtn.offsetHeight;
      if (newTop < 0) newTop = 0;
      if (newTop > maxTop) newTop = maxTop;

      expandBtn.style.top = `${newTop}px`;
      expandBtn.style.transform = 'none'; // Remove centering transform once moved
    });

    document.addEventListener('mouseup', () => {
      if (isBtnDragging) {
        isBtnDragging = false;
        expandBtn.style.cursor = '';

        if (isBtnClick) {
          // It was a click, trigger expand
          sidebar.classList.remove('collapsed');
          document.body.classList.add('chatgpt-outline-open');

          // Restore width
          const currentWidth = sidebar.offsetWidth || 300;
          document.body.style.paddingRight = `${currentWidth}px`;

          expandBtn.style.display = 'none';
        }
      }
    });

    document.body.appendChild(expandBtn);



    // Initialize state
    if (!sidebar.classList.contains('collapsed')) {
      document.body.classList.add('chatgpt-outline-open');
      expandBtn.style.display = 'none';
    } else {
      expandBtn.style.display = 'flex';
      // Ensure body doesn't have the open class
      document.body.classList.remove('chatgpt-outline-open');
    }
  }

  // Scan for messages and populate the outline
  function scanMessages() {
    const listContainer = document.getElementById('chatgpt-outline-list');
    if (!listContainer) return;

    listContainer.innerHTML = ''; // Clear current list

    // Selectors for ChatGPT messages
    const articles = document.querySelectorAll('article');

    let currentGroup = null;

    articles.forEach((article, index) => {
      // Try to determine if it's user or assistant
      const isUser = article.querySelector('[data-message-author-role="user"]');
      const isAssistant = article.querySelector('[data-message-author-role="assistant"]');

      let role = 'unknown';
      if (isUser) role = 'user';
      else if (isAssistant) role = 'assistant';

      if (role === 'unknown') return;

      // Extract text preview
      let text = '...';
      const contentDiv = article.querySelector('.markdown') || article.querySelector('.whitespace-pre-wrap');
      if (contentDiv) {
        text = contentDiv.textContent.trim().substring(0, 60);
        if (contentDiv.textContent.length > 60) text += '...';
      }

      // Logic for grouping:
      // If it's a User message, start a new group.
      // If it's an Assistant message, add to current group.
      // If no current group exists (e.g. chat starts with assistant?), create one.

      if (role === 'user') {
        currentGroup = document.createElement('div');
        currentGroup.className = 'qa-group';
        listContainer.appendChild(currentGroup);
      } else if (!currentGroup) {
        // Fallback for orphan assistant messages (or initial greeting)
        currentGroup = document.createElement('div');
        currentGroup.className = 'qa-group';
        listContainer.appendChild(currentGroup);
      }

      // Create outline item
      const item = document.createElement('div');
      item.className = `outline-item ${role}-msg`;
      // Remove Q: / A: prefix as requested for cleaner look, or keep it? 
      // User asked for "Q and corresponding A compact", implied visual grouping.
      // Let's keep prefixes but maybe smaller or just rely on styling.
      // Let's keep them for clarity but maybe simplify.
      item.textContent = `${role === 'user' ? 'Q: ' : 'A: '}${text}`;

      // Click to scroll
      item.addEventListener('click', () => {
        article.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });

      currentGroup.appendChild(item);
    });
  }

  // Debounced scan to avoid performance hit on every mutation
  function debouncedScan() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(scanMessages, 1000);
  }

  // Watch for DOM changes (new messages)
  function setupObserver() {
    const targetNode = document.body;
    const config = { childList: true, subtree: true };

    observer = new MutationObserver((mutationsList) => {
      // Check if sidebar or buttons are missing and re-inject if needed
      if (!document.getElementById('chatgpt-outline-sidebar') || !document.getElementById('chatgpt-outline-expand-btn')) {
        createSidebar();
      }

      for (const mutation of mutationsList) {
        if (mutation.type === 'childList') {
          // Check if relevant nodes were added (optimization can be done here)
          debouncedScan();
        }
      }
    });

    observer.observe(targetNode, config);
  }

  // Run init when page is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
