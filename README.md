# ChatGPT Outline Extension

A Chrome extension that generates a navigable outline for your ChatGPT conversations. It displays a sidebar on the right with a list of questions and answers, allowing you to quickly jump to specific parts of the chat.

## Features

- **Auto-generated Outline**: Automatically parses the chat and lists Q&A pairs.
- **Click to Scroll**: Click on any item in the sidebar to smoothly scroll to that message.
- **Embedded Layout**: The sidebar pushes the main chat content so nothing is obscured.
- **Resizable Sidebar**: Drag the left edge of the sidebar to adjust its width.
- **Collapsible**:
    - Click the **Close** button inside the sidebar.
    - Click the **blue resize handle** to quickly collapse.
- **Floating Expand Button**:
    - When collapsed, a floating button appears on the right.
    - **Draggable**: You can drag the floating button up and down to your preferred position.
- **Dark Mode Support**: Automatically adapts to ChatGPT's dark mode.

## Installation

1.  Clone or download this repository.
2.  Open Chrome and navigate to `chrome://extensions`.
3.  Enable **Developer mode** in the top right corner.
4.  Click **Load unpacked**.
5.  Select the directory containing this extension (where `manifest.json` is located).
6.  Refresh your ChatGPT page.

## Usage

1.  Open a conversation on [ChatGPT](https://chatgpt.com).
2.  The outline sidebar will appear on the right.
3.  **Resize**: Hover over the left border of the sidebar until the cursor changes, then drag.
4.  **Collapse**: Click the close button or the resize border.
5.  **Expand**: Click the floating chevron button on the right edge of the screen.
6.  **Move Button**: Click and drag the floating expand button to move it vertically.

## Permissions

- `activeTab`: To access the content of the current tab for parsing messages.
- `https://chatgpt.com/*`, `https://chat.openai.com/*`: To run on ChatGPT domains.
