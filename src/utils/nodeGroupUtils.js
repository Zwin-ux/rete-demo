/**
 * Node Group Utilities
 * Handles positioning and styling of node groups
 */

/**
 * Updates the styles of node groups based on data attributes
 */
export function updateNodeGroupStyles(): void {
  document.querySelectorAll('.node-group').forEach((group: Element) => {
    const x = group.getAttribute('data-x');
    const y = group.getAttribute('data-y');
    const width = group.getAttribute('data-width');
    const height = group.getAttribute('data-height');
    
    const htmlGroup = group as HTMLElement;
    if (x) htmlGroup.style.left = `${x}px`;
    if (y) htmlGroup.style.top = `${y}px`;
    if (width) htmlGroup.style.width = `${width}px`;
    if (height) htmlGroup.style.height = `${height}px`;
  });
}

/**
 * Initialize node group styling and observe DOM changes
 */
export function initNodeGroupStyling() {
  // Initial update
  updateNodeGroupStyles();
  
  // Update on mutations
  const observer = new MutationObserver(mutations => {
    // Check if any mutations involve node groups
    const shouldUpdate = mutations.some(mutation => {
      // Check added nodes
      for (const node of mutation.addedNodes) {
        if (node.nodeType === 1 && (
          node.classList?.contains('node-group') || 
          node.querySelector?.('.node-group')
        )) {
          return true;
        }
      }
      
      // Check attribute changes
      if (mutation.type === 'attributes' && 
          mutation.target.classList?.contains('node-group') &&
          ['data-x', 'data-y', 'data-width', 'data-height'].includes(mutation.attributeName)) {
        return true;
      }
      
      return false;
    });
    
    if (shouldUpdate) {
      updateNodeGroupStyles();
    }
  });
  
  observer.observe(document.body, { 
    childList: true, 
    subtree: true,
    attributes: true,
    attributeFilter: ['data-x', 'data-y', 'data-width', 'data-height']
  });
  
  return observer;
}
