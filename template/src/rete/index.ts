import { createWorkflowEditor } from './workflow-editor';
import { isHeadless } from '../headless';

export const createEditor = async (container: HTMLElement) => {
  if (isHeadless()) {
    container.classList.add('headless');
    document.body.style.overflow = 'hidden';
  }
  
  // Use our workflow editor
  return createWorkflowEditor(container);
}
