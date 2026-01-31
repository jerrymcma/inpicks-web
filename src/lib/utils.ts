export const formatPredictionText = (text: string): string => {
  if (!text) return text

  // If the text contains the standardized header, use it
  // This handles the new format where we explicitly ask for "AI Analysis of..."
  // and covers cases where the AI might still prepend "Okay..." before the header
  const headerIndex = text.indexOf('AI Analysis of the')
  if (headerIndex !== -1) {
    return text.substring(headerIndex)
  }

  // Handle legacy/conversational formats
  // Replace "Okay, I'll provide my analysis" with "AI Analysis"
  // The regex handles variations and case sensitivity
  let formatted = text
    .replace(/^(Okay|Sure|Certainly)[^.]*provide my analysis/i, 'AI Analysis')
    .replace(/^(Okay|Sure|Certainly)[^.]*analysis/i, 'AI Analysis')

  // If the replacement didn't happen (no match), but it looks like a conversation,
  // we might want to just capitalize it or leave it.
  // But based on the user request, the specific phrase is "Okay, I'll provide my analysis..."
  
  return formatted
}
