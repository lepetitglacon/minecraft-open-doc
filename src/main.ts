import { BlockViewer, ViewerMode } from './core/BlockViewer';
import './style.css';

async function init() {
  const container = document.getElementById('viewer-container');
  if (!container) {
    throw new Error('Container not found');
  }

  // Create viewer
  const viewer = new BlockViewer(container, {
    backgroundColor: 0x1a1a2e,
  });

  // Load mods
  try {
    await viewer.loadMod('/data/mods/minecraft.json');
    console.log('Loaded Minecraft blocks');
  } catch (e) {
    console.warn('Could not load Minecraft mod:', e);
  }

  try {
    await viewer.loadMod('/data/mods/ae2.json');
    console.log('Loaded AE2 blocks');
  } catch (e) {
    console.warn('Could not load AE2 mod:', e);
  }

  // Create UI
  createUI(viewer);

  // Start in build mode by default
  viewer.setMode('build');

  // Select first block if available
  const blocks = viewer.getAllBlockIds();
  if (blocks.length > 0) {
    await viewer.selectBlockForBuilding(blocks[0]);
  }
}

function createUI(viewer: BlockViewer) {
  const uiContainer = document.getElementById('ui-container');
  if (!uiContainer) return;

  // Title
  const title = document.createElement('h2');
  title.textContent = 'Minecraft Block Builder';
  uiContainer.appendChild(title);

  // Mode toggle
  const modeContainer = document.createElement('div');
  modeContainer.className = 'mode-container';

  const modeLabel = document.createElement('label');
  modeLabel.textContent = 'Mode: ';
  modeContainer.appendChild(modeLabel);

  const modeSelect = document.createElement('select');
  modeSelect.id = 'mode-select';

  const viewOption = document.createElement('option');
  viewOption.value = 'view';
  viewOption.textContent = 'View';
  modeSelect.appendChild(viewOption);

  const buildOption = document.createElement('option');
  buildOption.value = 'build';
  buildOption.textContent = 'Build';
  buildOption.selected = true;
  modeSelect.appendChild(buildOption);

  modeSelect.addEventListener('change', async () => {
    const mode = modeSelect.value as ViewerMode;
    viewer.setMode(mode);
    updateInstructions(mode);

    if (mode === 'build') {
      const blockId = blockSelect.value;
      if (blockId) {
        await viewer.selectBlockForBuilding(blockId);
      }
    } else {
      viewer.deselectBlock();
      // Show selected block in view mode
      const blockId = blockSelect.value;
      if (blockId) {
        await viewer.displayBlock(blockId);
      }
    }
  });

  modeContainer.appendChild(modeSelect);
  uiContainer.appendChild(modeContainer);

  // Block selector
  const selectorContainer = document.createElement('div');
  selectorContainer.className = 'selector-container';

  const label = document.createElement('label');
  label.textContent = 'Select Block: ';
  label.htmlFor = 'block-select';
  selectorContainer.appendChild(label);

  const blockSelect = document.createElement('select');
  blockSelect.id = 'block-select';

  // Group blocks by namespace
  const registry = viewer.getRegistry();
  const namespaces = registry.getAllNamespaces();

  namespaces.forEach((namespace) => {
    const optgroup = document.createElement('optgroup');
    optgroup.label = namespace.charAt(0).toUpperCase() + namespace.slice(1);

    const blocks = registry.getByNamespace(namespace);
    blocks.forEach((block) => {
      const option = document.createElement('option');
      option.value = block.id;
      option.textContent = block.displayName || block.id.split(':')[1];
      optgroup.appendChild(option);
    });

    blockSelect.appendChild(optgroup);
  });

  blockSelect.addEventListener('change', async () => {
    const blockId = blockSelect.value;
    if (blockId) {
      if (viewer.getMode() === 'build') {
        await viewer.selectBlockForBuilding(blockId);
      } else {
        await viewer.displayBlock(blockId);
      }
    }
  });

  selectorContainer.appendChild(blockSelect);
  uiContainer.appendChild(selectorContainer);

  // Buttons container
  const buttonsContainer = document.createElement('div');
  buttonsContainer.className = 'buttons-container';

  // Reset camera button
  const resetBtn = document.createElement('button');
  resetBtn.textContent = 'Reset Camera';
  resetBtn.addEventListener('click', () => viewer.resetCamera());
  buttonsContainer.appendChild(resetBtn);

  // Clear all blocks button
  const clearBtn = document.createElement('button');
  clearBtn.textContent = 'Clear All Blocks';
  clearBtn.addEventListener('click', () => {
    if (confirm('Clear all placed blocks?')) {
      viewer.clearPlacedBlocks();
    }
  });
  buttonsContainer.appendChild(clearBtn);

  uiContainer.appendChild(buttonsContainer);

  // Instructions
  const instructions = document.createElement('p');
  instructions.className = 'instructions';
  instructions.id = 'instructions';
  uiContainer.appendChild(instructions);

  function updateInstructions(mode: ViewerMode) {
    if (mode === 'build') {
      instructions.innerHTML = `
        <strong>Build Mode Controls:</strong><br>
        Left click: Place block<br>
        Right click: Remove block<br>
        Middle click + drag: Rotate<br>
        Scroll: Zoom
      `;
    } else {
      instructions.innerHTML = `
        <strong>View Mode Controls:</strong><br>
        Left click + drag: Rotate<br>
        Right click + drag: Pan<br>
        Scroll: Zoom
      `;
    }
  }

  updateInstructions('build');
}

init().catch(console.error);
