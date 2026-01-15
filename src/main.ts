import { BlockViewer, ViewerMode } from './core/BlockViewer';
import { SceneListItem } from './core/SceneStorageManager';
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
    const blockSelect = document.getElementById('block-select') as HTMLSelectElement;
    if (blockSelect) {
      blockSelect.value = blocks[0];
    }
    await viewer.selectBlockForBuilding(blocks[0]);
  }

  // Load last scene if exists
  await viewer.loadScene();
}

function createUI(viewer: BlockViewer) {
  const uiContainer = document.getElementById('ui-container');
  if (!uiContainer) return;

  // Title
  const title = document.createElement('h2');
  title.textContent = 'Minecraft Block Builder';
  uiContainer.appendChild(title);

  // Scene info
  const sceneInfo = document.createElement('div');
  sceneInfo.className = 'scene-info';
  sceneInfo.innerHTML = '<span class="scene-name">New Scene</span>';
  uiContainer.appendChild(sceneInfo);

  function updateSceneInfo() {
    const sceneId = viewer.getCurrentSceneId();
    const sceneName = sceneInfo.querySelector('.scene-name')!;
    if (sceneId) {
      const scene = viewer.getSceneManager().getScene(sceneId);
      sceneName.textContent = scene?.name || 'Unnamed Scene';
    } else {
      sceneName.textContent = 'New Scene (unsaved)';
    }
  }

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
    if (blockId && viewer.getMode() === 'build') {
      await viewer.selectBlockForBuilding(blockId);
    }
  });

  selectorContainer.appendChild(blockSelect);
  uiContainer.appendChild(selectorContainer);

  // Scene management section
  const sceneSection = document.createElement('div');
  sceneSection.className = 'scene-section';

  const sceneSectionTitle = document.createElement('h3');
  sceneSectionTitle.textContent = 'Scenes';
  sceneSection.appendChild(sceneSectionTitle);

  // Scene buttons
  const sceneButtons = document.createElement('div');
  sceneButtons.className = 'scene-buttons';

  const newSceneBtn = document.createElement('button');
  newSceneBtn.textContent = 'New';
  newSceneBtn.addEventListener('click', () => {
    if (viewer.getPlacedBlocks().length > 0) {
      if (!confirm('Create new scene? Unsaved changes will be lost.')) return;
    }
    viewer.newScene();
    updateSceneInfo();
    refreshSceneList();
  });
  sceneButtons.appendChild(newSceneBtn);

  const saveSceneBtn = document.createElement('button');
  saveSceneBtn.textContent = 'Save';
  saveSceneBtn.className = 'save-btn';
  saveSceneBtn.addEventListener('click', () => {
    if (!viewer.getCurrentSceneId()) {
      const name = prompt('Scene name:', `Scene ${viewer.getSceneManager().listScenes().length + 1}`);
      if (!name) return;
      viewer.saveSceneAs(name);
    } else {
      viewer.saveScene();
    }
    updateSceneInfo();
    refreshSceneList();
  });
  sceneButtons.appendChild(saveSceneBtn);

  const saveAsBtn = document.createElement('button');
  saveAsBtn.textContent = 'Save As';
  saveAsBtn.addEventListener('click', () => {
    const name = prompt('Scene name:');
    if (!name) return;
    viewer.saveSceneAs(name);
    updateSceneInfo();
    refreshSceneList();
  });
  sceneButtons.appendChild(saveAsBtn);

  sceneSection.appendChild(sceneButtons);

  // Scene list
  const sceneListContainer = document.createElement('div');
  sceneListContainer.className = 'scene-list';
  sceneSection.appendChild(sceneListContainer);

  function refreshSceneList() {
    const scenes = viewer.getSceneManager().listScenes();
    sceneListContainer.innerHTML = '';

    if (scenes.length === 0) {
      sceneListContainer.innerHTML = '<div class="no-scenes">No saved scenes</div>';
      return;
    }

    scenes.forEach((scene: SceneListItem) => {
      const item = document.createElement('div');
      item.className = 'scene-item';
      if (scene.id === viewer.getCurrentSceneId()) {
        item.classList.add('active');
      }

      const info = document.createElement('div');
      info.className = 'scene-item-info';
      info.innerHTML = `
        <span class="scene-item-name">${scene.name}</span>
        <span class="scene-item-meta">${scene.blockCount} blocks</span>
      `;
      info.addEventListener('click', async () => {
        await viewer.loadScene(scene.id);
        updateSceneInfo();
        refreshSceneList();
      });
      item.appendChild(info);

      const actions = document.createElement('div');
      actions.className = 'scene-item-actions';

      const deleteBtn = document.createElement('button');
      deleteBtn.textContent = '×';
      deleteBtn.title = 'Delete';
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm(`Delete "${scene.name}"?`)) {
          viewer.getSceneManager().deleteScene(scene.id);
          if (viewer.getCurrentSceneId() === scene.id) {
            viewer.newScene();
            updateSceneInfo();
          }
          refreshSceneList();
        }
      });
      actions.appendChild(deleteBtn);

      item.appendChild(actions);
      sceneListContainer.appendChild(item);
    });
  }

  uiContainer.appendChild(sceneSection);

  // Action buttons
  const buttonsContainer = document.createElement('div');
  buttonsContainer.className = 'buttons-container';

  const resetBtn = document.createElement('button');
  resetBtn.textContent = 'Reset Camera';
  resetBtn.addEventListener('click', () => viewer.resetCamera());
  buttonsContainer.appendChild(resetBtn);

  const clearBtn = document.createElement('button');
  clearBtn.textContent = 'Clear All Blocks';
  clearBtn.className = 'danger-btn';
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
        <strong>Build Mode:</strong><br>
        Left click: Place block<br>
        Right click: Remove block<br>
        Drag: Rotate camera<br>
        Scroll: Zoom
      `;
    } else {
      instructions.innerHTML = `
        <strong>View Mode:</strong><br>
        Left drag: Rotate<br>
        Right drag: Pan<br>
        Scroll: Zoom
      `;
    }
  }

  updateInstructions('build');
  refreshSceneList();
}

init().catch(console.error);
