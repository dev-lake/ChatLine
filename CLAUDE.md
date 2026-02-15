# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A Chrome extension that generates a navigable outline sidebar for ChatGPT, DeepSeek, and Gemini conversations. The sidebar displays Q&A pairs and allows users to jump to specific parts of the chat.

## Architecture

### Content Script Pattern
- Single content script (`content.js`) injected into chat pages via `manifest.json`
- No background scripts or popup UI - everything runs in the page context
- Uses MutationObserver to watch for new messages and re-scan the DOM

### Multi-Site Support
The extension supports three chat platforms with different DOM structures:
- **ChatGPT**: Uses `article` elements and `[data-message-author-role]` attributes
- **DeepSeek**: Uses `.ds-message` containers with `.ds-markdown` for assistant messages
- **Gemini**: Uses custom elements like `user-query`, `assistant-response`, and various `aria-label` attributes

Message detection logic in `getMessageElements()` (content.js:232) combines multiple selectors and deduplicates nested elements. Role resolution in `resolveRole()` (content.js:304) uses site-specific heuristics.

### Key Components

**Sidebar UI** (content.js:18-177):
- Fixed position sidebar on the right edge
- Resizable via drag handle on left border
- Collapsible with floating expand button
- Width changes trigger layout adjustments via `setContentPadding()`

**Message Scanning** (content.js:180-229):
- Groups messages into Q&A pairs (user question + assistant answer)
- Extracts 60-character previews from message content
- Debounced re-scanning (1000ms) to avoid performance issues during streaming responses

**Layout Management** (content.js:398-486):
- `setContentPadding()` adjusts main content area width when sidebar is open
- Site-specific selectors for different DOM structures
- Gemini maintains centered layout (no padding adjustment)
- DeepSeek requires targeting `.ds-theme` containers

### State Management
- Sidebar collapsed state controlled by `.collapsed` class
- Body class `.chatgpt-outline-open` triggers layout shifts
- Expand button visibility toggled via `display` style
- Sidebar width stored in inline styles and CSS variables

## Development

### Loading the Extension
1. Open Chrome and navigate to `chrome://extensions`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select this directory

### Testing Changes
- Modify `content.js` or `styles.css`
- Go to `chrome://extensions` and click the reload icon for this extension
- Refresh the chat page to see changes

### Adding Support for New Sites
1. Add URL pattern to `manifest.json` content_scripts matches
2. Add site-specific selectors to `getMessageElements()`
3. Add role detection logic to `resolveRole()`
4. Test layout adjustments in `setContentPadding()`

## Important Patterns

**Drag vs Click Detection**: Both the resize handle and expand button distinguish between clicks and drags by tracking mouse movement distance (>3px = drag). This allows the resize handle to collapse on click while still supporting drag-to-resize.

**Debounced Scanning**: The MutationObserver triggers `debouncedScan()` which waits 1000ms before re-scanning messages. This prevents performance issues during streaming responses where the DOM updates rapidly.

**Nested Element Filtering**: `getMessageElements()` deduplicates by removing any element that is contained within another matched element, ensuring we only process top-level message containers.
