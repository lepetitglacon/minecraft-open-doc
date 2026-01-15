export type BlockFace = 'top' | 'bottom' | 'north' | 'south' | 'east' | 'west';

export type BlockShapeType = 'full_cube' | 'slab_bottom' | 'slab_top' | 'stairs';

export interface BlockTextures {
  all?: string;
  top?: string;
  bottom?: string;
  sides?: string;
  north?: string;
  south?: string;
  east?: string;
  west?: string;
}

export interface BlockDefinition {
  id: string;
  displayName?: string;
  shape: BlockShapeType;
  textures: BlockTextures;
  transparent?: boolean;
  renderType?: 'solid' | 'cutout' | 'translucent';
}

export interface ModDefinition {
  namespace: string;
  name: string;
  version?: string;
  textureBasePath: string;
  blocks: BlockDefinition[];
}

export interface ResolvedFaceTextures {
  top: string;
  bottom: string;
  north: string;
  south: string;
  east: string;
  west: string;
}
