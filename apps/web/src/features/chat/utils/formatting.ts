/**
 * Text formatting utilities for chat messages
 */

/**
 * Format mentions in message content
 */
export function formatMentions(content: string): string {
  return content.replace(/@(\w+)/g, '<span class="text-blue-500 font-medium">@$1</span>');
}

/**
 * Format code blocks in message content
 */
export function formatCodeBlocks(content: string): string {
  return content.replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre class="bg-gray-800 p-4 rounded-lg overflow-x-auto"><code>$2</code></pre>');
}

/**
 * Format inline code in message content
 */
export function formatInlineCode(content: string): string {
  return content.replace(/`([^`]+)`/g, '<code class="bg-gray-700 px-1 rounded">$1</code>');
}

/**
 * Format bold text in message content
 */
export function formatBold(content: string): string {
  return content.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
}

/**
 * Format italic text in message content
 */
export function formatItalic(content: string): string {
  return content.replace(/\*([^*]+)\*/g, '<em>$1</em>');
}

/**
 * Format all markdown-like syntax in message content
 */
export function formatMessageContent(content: string): string {
  let formatted = content;
  formatted = formatCodeBlocks(formatted);
  formatted = formatInlineCode(formatted);
  formatted = formatBold(formatted);
  formatted = formatItalic(formatted);
  formatted = formatMentions(formatted);
  return formatted;
}

/**
 * Get word count from message content
 */
export function getWordCount(content: string): number {
  return content.trim().split(/\s+/).filter(word => word.length > 0).length;
}

/**
 * Check if content is empty or only whitespace
 */
export function isEmptyContent(content: string): boolean {
  return !content || content.trim().length === 0;
}