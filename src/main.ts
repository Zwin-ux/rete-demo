import { initEditor, initNodePalette, createNode } from './editor';

document.addEventListener('DOMContentLoaded', async () => {
    const container = document.getElementById('editor') as HTMLElement;
    const palette = document.getElementById('node-palette') as HTMLElement;
    
    if (!container || !palette) {
        console.error('Could not find editor or palette element');
        return;
    }

    // Initialize editor
    const { editor } = await initEditor(container);
    
    // Initialize node palette
    initNodePalette(palette, (type) => {
        // This will be called when a node is dragged from the palette
        console.log('Dragging node:', type);
    });
    
    // Handle node drop on the editor
    container.addEventListener('drop', async (e: DragEvent) => {
        e.preventDefault();
        const type = e.dataTransfer?.getData('application/node-type');
        if (type) {
            const rect = container.getBoundingClientRect();
            const position = {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            };
            const node = createNode(type, position);
            await editor.addNode(node);
        }
    });
    
    // Allow drop
    container.addEventListener('dragover', (e) => {
        e.preventDefault();
    });
});
