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
          setContentPadding(`${width}px`);
        }
      }
    });

    document.addEventListener('mouseup', () => {
      if (isResizing) {
        isResizing = false;
        resizer.classList.remove('resizing');
        document.body.style.cursor = '';
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

    // Hover to expand
    let hoverTimer = null;

    expandBtn.addEventListener('mouseenter', () => {
      // Small delay to avoid accidental triggers
      hoverTimer = setTimeout(() => {
        sidebar.classList.remove('collapsed');
        document.body.classList.add('chatgpt-outline-open');
        expandBtn.style.display = 'none';
      }, 200);
    });

    expandBtn.addEventListener('mouseleave', () => {
      clearTimeout(hoverTimer);
    });

    // Collapse when mouse leaves sidebar
    sidebar.addEventListener('mouseleave', () => {
      sidebar.classList.add('collapsed');
      document.body.classList.remove('chatgpt-outline-open');
      setContentPadding('');
      expandBtn.style.display = 'flex';
    });

    // Drag Logic for Expand Button (for repositioning)
    let isBtnDragging = false;
    let btnStartY, btnStartTop;

    expandBtn.addEventListener('mousedown', (e) => {
      isBtnDragging = true;
      btnStartY = e.clientY;
      const rect = expandBtn.getBoundingClientRect();
      btnStartTop = rect.top;

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
      let newTop = btnStartTop + deltaY;

      const maxTop = window.innerHeight - expandBtn.offsetHeight;
      if (newTop < 0) newTop = 0;
      if (newTop > maxTop) newTop = maxTop;

      expandBtn.style.top = `${newTop}px`;
      expandBtn.style.transform = 'none';
    });

    document.addEventListener('mouseup', () => {
      if (isBtnDragging) {
        isBtnDragging = false;
        expandBtn.style.cursor = '';
      }
    });

    document.body.appendChild(expandBtn);



    // Initialize state
    if (!sidebar.classList.contains('collapsed')) {
      document.body.classList.add('chatgpt-outline-open');
      setContentPadding(`${sidebar.offsetWidth || 300}px`);
      expandBtn.style.display = 'none';
    } else {
      expandBtn.style.display = 'flex';
      // Ensure body doesn't have the open class
      document.body.classList.remove('chatgpt-outline-open');
      setContentPadding('');
    }
  }

  // Scan for messages and populate the outline
  function scanMessages() {
    const listContainer = document.getElementById('chatgpt-outline-list');
    if (!listContainer) return;

    listContainer.innerHTML = ''; // Clear current list

    const messageNodes = getMessageElements();

    let currentGroup = null;

    messageNodes.forEach((node, index) => {
      const role = resolveRole(node, index);
      if (role === 'unknown') return;

      // Extract text preview
      const text = extractPreview(node);

      // Logic for grouping:
      // If it's a User message, start a new group.
      // If it's an Assistant message, add to current group.
      // If no current group exists (e.g. chat starts with assistant?), create one.

      if (role === 'user') {
        currentGroup = document.createElement('div');
        currentGroup.className = 'qa-group';
        attachGroupClickHandler(currentGroup, node, index);

        listContainer.appendChild(currentGroup);
      } else if (!currentGroup) {
        // Fallback for orphan assistant messages (or initial greeting)
        currentGroup = document.createElement('div');
        currentGroup.className = 'qa-group';
        attachGroupClickHandler(currentGroup, node, index);

        listContainer.appendChild(currentGroup);
      }

      // Create outline item
      const item = document.createElement('div');
      item.className = `outline-item ${role}-msg`;
      item.textContent = `${role === 'user' ? 'Q: ' : 'A: '}${text}`;

      currentGroup.appendChild(item);
    });
  }

  function attachGroupClickHandler(groupNode, messageNode, messageIndex) {
    groupNode.addEventListener('click', (event) => {
      event.stopPropagation();
      jumpToMessage(messageNode, messageIndex);
    });
  }

  function jumpToMessage(savedNode, fallbackIndex) {
    let targetNode = savedNode;

    if (!targetNode || !targetNode.isConnected) {
      const latestNodes = getMessageElements();
      targetNode = latestNodes[fallbackIndex] || null;
    }

    if (!targetNode) return;

    targetNode.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
      inline: 'nearest'
    });
  }

  // Collect message-like elements across supported sites (ChatGPT + DeepSeek)
  function getMessageElements() {
    const baseSelectors = [
      'article',
      '[data-message-author-role]',
      '[data-role="message"]',
      '[data-role="chat-message"]',
      '[data-msg-role]',
      '[data-chat-role]',
      '.chat-message',
      '.conversation-message',
      '.ds-chat-message',
      '[class*="chat-message"]',
      '[class*="conversation-item"]'
    ];

    const deepseekSelectors = [
      '.ds-message',
      '[data-testid="chatMessage"]',
      '.ds-markdown'
    ];

    const geminiSelectors = [
      '[data-message-id]',
      '[data-testid="message"]',
      '[data-utterance-id]',
      '[role="listitem"] [aria-label*="message"]',
      '[aria-label*="Message"]',
      '[aria-label*="chat message"]',
      '[aria-roledescription="message"]',
      'c-wiz [data-message-id]',
      '[data-test-id*="message"]',
      '[data-test-id*="response"]',
      'user-query',
      'assistant-response',
      'bard-response',
      'bard-chat-message',
      '.user-query-container',
      '.message-content',
      '.response-content'
    ];

    const host = location.hostname;
    const selectors = host.includes('deepseek')
      ? baseSelectors.concat(deepseekSelectors)
      : host.includes('gemini.google')
        ? baseSelectors.concat(geminiSelectors)
        : baseSelectors;

    const raw = selectors.flatMap((sel) => Array.from(document.querySelectorAll(sel)));

    // Deduplicate: keep outermost message containers (e.g., .ds-message over inner .ds-markdown)
    const unique = [];
    raw.forEach((node) => {
      if (!node) return;
      if (unique.includes(node)) return;
      unique.push(node);
    });

    const filtered = unique.filter(
      (node) => !unique.some((other) => other !== node && other.contains(node))
    );

    filtered.sort((a, b) => {
      const pos = a.compareDocumentPosition(b);
      if (pos & Node.DOCUMENT_POSITION_PRECEDING) return 1;
      if (pos & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
      return 0;
    });

    return filtered;
  }

  function resolveRole(node, index) {
    const attrRole =
      node.getAttribute('data-message-author-role') ||
      node.getAttribute('data-role') ||
      node.getAttribute('data-msg-role') ||
      node.getAttribute('data-chat-role');

    const isDeepseek = location.hostname.includes('deepseek');
    const isGemini = location.hostname.includes('gemini.google');

    if (isDeepseek && node.classList?.contains('ds-message')) {
      return node.querySelector('.ds-markdown') ? 'assistant' : 'user';
    }

    if (isGemini) {
      const tag = (node.tagName || '').toLowerCase();
      if (tag === 'user-query' || node.classList.contains('user-query-container')) return 'user';
      if (tag === 'assistant-response' || tag === 'bard-response' || tag === 'bard-chat-message') return 'assistant';

      const label = (node.getAttribute('aria-label') || '').toLowerCase();
      if (label.includes('user') || label.includes('you')) return 'user';
      if (label.includes('gemini') || label.includes('assistant')) return 'assistant';
    }

    if (attrRole) {
      const val = attrRole.toLowerCase();
      if (val.includes('user')) return 'user';
      if (val.includes('assistant') || val.includes('bot')) return 'assistant';
    }

    const className = (node.className || '').toString().toLowerCase();
    if (className.includes('user')) return 'user';
    if (className.includes('assistant') || className.includes('bot')) return 'assistant';

    // DeepSeek: assistant messages often contain markdown blocks
    if (node.querySelector('.ds-markdown, .markdown')) return 'assistant';

    // Fallback: assume alternating user / assistant starting with user
    return index % 2 === 0 ? 'user' : 'assistant';
  }

  function extractPreview(node) {
    let text = '...';
    const contentNode =
      node.querySelector(
        '.markdown, .whitespace-pre-wrap, .ds-markdown, .message-content, .fbb737a4, [data-message-text], [data-utterance-id], .query-text, bard-response, assistant-response'
      ) || node;

    if (contentNode) {
      const contentText = contentNode.textContent.trim();
      if (contentText) {
        text = contentText.substring(0, 60);
        if (contentText.length > 60) text += '...';
      }
    }

    return text;
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

  function setContentPadding(value) {
    // Floating sidebar mode - no content padding needed
    // Sidebar now floats over content without shifting layout
    return;
  }

})();
