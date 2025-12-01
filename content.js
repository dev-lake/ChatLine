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

        // Handle Click to Collapse
        if (isClick) {
          sidebar.classList.add('collapsed');
          document.body.classList.remove('chatgpt-outline-open');
          setContentPadding('');

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
          setContentPadding(`${currentWidth}px`);

          expandBtn.style.display = 'none';
        }
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
        node.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });

      currentGroup.appendChild(item);
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

    const selectors = location.hostname.includes('deepseek')
      ? baseSelectors.concat(deepseekSelectors)
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
    if (isDeepseek && node.classList?.contains('ds-message')) {
      return node.querySelector('.ds-markdown') ? 'assistant' : 'user';
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
        '.markdown, .whitespace-pre-wrap, .ds-markdown, .message-content, .fbb737a4'
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
    const widthVal = value || '';
    const messageWidthVal = widthVal ? `calc(100% - ${widthVal})` : '';
    const isDeepseek = location.hostname.includes('deepseek');

    const candidates = [
      document.body,
      document.getElementById('root'),
      document.querySelector('main'),
      document.querySelector('[role="main"]'),
      document.querySelector('.conversation-container'),
      document.querySelector('.chat-body')
    ].filter(Boolean);

    const structural = [
      document.querySelector('#root > div'),
      document.querySelector('#root > div > div')
    ].filter(Boolean);

    candidates.forEach((el) => {
      el.style.paddingRight = widthVal;
      el.style.marginRight = widthVal;
    });

    const setWidths = (els) => {
      els.forEach((el) => {
        if (widthVal) {
          el.style.width = messageWidthVal;
          el.style.maxWidth = messageWidthVal;
          el.style.boxSizing = 'border-box';
        } else {
          el.style.width = '';
          el.style.maxWidth = '';
          el.style.boxSizing = '';
        }
      });
    };

    setWidths(structural);

    if (isDeepseek) {
      const deepseekContainers = [
        document.querySelector('[class*="ds-theme"]'),
        document.querySelector('[class*="ds-theme"] > div'),
        document.querySelector('[class*="ds-theme"] > div > div')
      ].filter(Boolean);

      setWidths(deepseekContainers);
    }

    document.documentElement.style.setProperty('--chatgpt-outline-width', widthVal);
    document.documentElement.style.setProperty('--message-area-width', messageWidthVal);
    document.body.style.setProperty('--chatgpt-outline-width', widthVal);

    const root = document.getElementById('root');
    if (root) {
      root.style.setProperty('--chatgpt-outline-width', widthVal);
      root.style.setProperty('--message-area-width', messageWidthVal);
    }

    const mainEl = document.querySelector('main') || document.querySelector('[role="main"]');
    if (mainEl) {
      mainEl.style.setProperty('--chatgpt-outline-width', widthVal);
      mainEl.style.setProperty('--message-area-width', messageWidthVal);
    }
  }

})();
