import type { ModDefinition } from '../../types';

const mekanismMod: ModDefinition = {
  namespace: 'mekanism',
  name: 'Mekanism',
  version: 'release/1.20.4',
  textureBasePath: '/textures/mekanism/release/1.20.4/blocks/',
  blocks: [
  {
    id: 'mekanism:advanced_bin',
    displayName: 'Advanced Bin',
    shape: 'full_cube' as const,
    textures: {
      all: 'bin/front.png',
      top: 'bin/top.png',
      bottom: 'bin/bottom.png',
      sides: 'bin/advanced_side.png',
      north: 'bin/front.png',
      south: 'bin/advanced_back.png'
    }
  },
  {
    id: 'mekanism:advanced_bounding_block',
    displayName: 'Advanced Bounding Block',
    shape: 'full_cube' as const,
    textures: {
      all: 'steel_casing.png'
    }
  },
  {
    id: 'mekanism:advanced_chemical_tank',
    displayName: 'Advanced Chemical Tank',
    shape: 'full_cube' as const,
    textures: {
      all: 'models/chemical_tank.png'
    }
  },
  {
    id: 'mekanism:advanced_combining_factory',
    displayName: 'Advanced Combining Factory',
    shape: 'full_cube' as const,
    textures: {
      all: 'factory/combining/combining_factory_front.png'
    }
  },
  {
    id: 'mekanism:advanced_compressing_factory',
    displayName: 'Advanced Compressing Factory',
    shape: 'full_cube' as const,
    textures: {
      all: 'factory/compressing/compressing_factory_front.png'
    }
  },
  {
    id: 'mekanism:advanced_crushing_factory',
    displayName: 'Advanced Crushing Factory',
    shape: 'full_cube' as const,
    textures: {
      all: 'factory/crushing/crushing_factory_front.png'
    }
  },
  {
    id: 'mekanism:advanced_energy_cube',
    displayName: 'Advanced Energy Cube',
    shape: 'full_cube' as const,
    textures: {
      all: 'energy_cube_particle.png'
    }
  },
  {
    id: 'mekanism:advanced_enriching_factory',
    displayName: 'Advanced Enriching Factory',
    shape: 'full_cube' as const,
    textures: {
      all: 'factory/enriching/enriching_factory_front.png'
    }
  },
  {
    id: 'mekanism:advanced_fluid_tank',
    displayName: 'Advanced Fluid Tank',
    shape: 'full_cube' as const,
    textures: {
      all: 'models/fluid_tank_side_off.png'
    }
  },
  {
    id: 'mekanism:advanced_induction_cell',
    displayName: 'Advanced Induction Cell',
    shape: 'full_cube' as const,
    textures: {
      all: 'advanced_induction_cell.png'
    }
  },
  {
    id: 'mekanism:advanced_induction_provider',
    displayName: 'Advanced Induction Provider',
    shape: 'full_cube' as const,
    textures: {
      all: 'advanced_induction_provider.png'
    }
  },
  {
    id: 'mekanism:advanced_infusing_factory',
    displayName: 'Advanced Infusing Factory',
    shape: 'full_cube' as const,
    textures: {
      all: 'factory/infusing/infusing_factory_front.png'
    }
  },
  {
    id: 'mekanism:advanced_injecting_factory',
    displayName: 'Advanced Injecting Factory',
    shape: 'full_cube' as const,
    textures: {
      all: 'factory/injecting/injecting_factory_front.png'
    }
  },
  {
    id: 'mekanism:advanced_logistical_transporter',
    displayName: 'Advanced Logistical Transporter',
    shape: 'full_cube' as const,
    textures: {
      all: 'models/multipart/advanced_logistical_transporter.png',
      sides: 'models/multipart/advanced_logistical_transporter_vertical.png'
    }
  },
  {
    id: 'mekanism:advanced_mechanical_pipe',
    displayName: 'Advanced Mechanical Pipe',
    shape: 'full_cube' as const,
    textures: {
      all: 'models/multipart/advanced_mechanical_pipe.png',
      sides: 'models/multipart/advanced_mechanical_pipe_vertical.png'
    }
  },
  {
    id: 'mekanism:advanced_pressurized_tube',
    displayName: 'Advanced Pressurized Tube',
    shape: 'full_cube' as const,
    textures: {
      all: 'models/multipart/advanced_pressurized_tube.png',
      sides: 'models/multipart/advanced_pressurized_tube_vertical.png'
    }
  },
  {
    id: 'mekanism:advanced_purifying_factory',
    displayName: 'Advanced Purifying Factory',
    shape: 'full_cube' as const,
    textures: {
      all: 'factory/purifying/purifying_factory_front.png'
    }
  },
  {
    id: 'mekanism:advanced_sawing_factory',
    displayName: 'Advanced Sawing Factory',
    shape: 'full_cube' as const,
    textures: {
      all: 'factory/sawing/sawing_factory_front.png'
    }
  },
  {
    id: 'mekanism:advanced_smelting_factory',
    displayName: 'Advanced Smelting Factory',
    shape: 'full_cube' as const,
    textures: {
      all: 'factory/smelting/smelting_factory_front.png'
    }
  },
  {
    id: 'mekanism:advanced_thermodynamic_conductor',
    displayName: 'Advanced Thermodynamic Conductor',
    shape: 'full_cube' as const,
    textures: {
      all: 'models/multipart/advanced_thermodynamic_conductor.png',
      sides: 'models/multipart/advanced_thermodynamic_conductor_vertical.png'
    }
  },
  {
    id: 'mekanism:advanced_universal_cable',
    displayName: 'Advanced Universal Cable',
    shape: 'full_cube' as const,
    textures: {
      all: 'models/multipart/advanced_universal_cable.png',
      sides: 'models/multipart/advanced_universal_cable_vertical.png'
    }
  },
  {
    id: 'mekanism:antiprotonic_nucleosynthesizer',
    displayName: 'Antiprotonic Nucleosynthesizer',
    shape: 'full_cube' as const,
    textures: {
      all: 'models/antiprotonic_nucleosynthesizer_front.png'
    }
  },
  {
    id: 'mekanism:basic_bin',
    displayName: 'Basic Bin',
    shape: 'full_cube' as const,
    textures: {
      all: 'bin/front.png',
      top: 'bin/top.png',
      bottom: 'bin/bottom.png',
      sides: 'bin/side.png',
      north: 'bin/front.png',
      south: 'bin/back.png'
    }
  },
  {
    id: 'mekanism:basic_chemical_tank',
    displayName: 'Basic Chemical Tank',
    shape: 'full_cube' as const,
    textures: {
      all: 'models/chemical_tank.png'
    }
  },
  {
    id: 'mekanism:basic_combining_factory',
    displayName: 'Basic Combining Factory',
    shape: 'full_cube' as const,
    textures: {
      all: 'factory/combining/combining_factory_front.png'
    }
  },
  {
    id: 'mekanism:basic_compressing_factory',
    displayName: 'Basic Compressing Factory',
    shape: 'full_cube' as const,
    textures: {
      all: 'factory/compressing/compressing_factory_front.png'
    }
  },
  {
    id: 'mekanism:basic_crushing_factory',
    displayName: 'Basic Crushing Factory',
    shape: 'full_cube' as const,
    textures: {
      all: 'factory/crushing/crushing_factory_front.png'
    }
  },
  {
    id: 'mekanism:basic_energy_cube',
    displayName: 'Basic Energy Cube',
    shape: 'full_cube' as const,
    textures: {
      all: 'energy_cube_particle.png'
    }
  },
  {
    id: 'mekanism:basic_enriching_factory',
    displayName: 'Basic Enriching Factory',
    shape: 'full_cube' as const,
    textures: {
      all: 'factory/enriching/enriching_factory_front.png'
    }
  },
  {
    id: 'mekanism:basic_fluid_tank',
    displayName: 'Basic Fluid Tank',
    shape: 'full_cube' as const,
    textures: {
      all: 'models/fluid_tank_side_off.png'
    }
  },
  {
    id: 'mekanism:basic_induction_cell',
    displayName: 'Basic Induction Cell',
    shape: 'full_cube' as const,
    textures: {
      all: 'basic_induction_cell.png'
    }
  },
  {
    id: 'mekanism:basic_induction_provider',
    displayName: 'Basic Induction Provider',
    shape: 'full_cube' as const,
    textures: {
      all: 'basic_induction_provider.png'
    }
  },
  {
    id: 'mekanism:basic_infusing_factory',
    displayName: 'Basic Infusing Factory',
    shape: 'full_cube' as const,
    textures: {
      all: 'factory/infusing/infusing_factory_front.png'
    }
  },
  {
    id: 'mekanism:basic_injecting_factory',
    displayName: 'Basic Injecting Factory',
    shape: 'full_cube' as const,
    textures: {
      all: 'factory/injecting/injecting_factory_front.png'
    }
  },
  {
    id: 'mekanism:basic_logistical_transporter',
    displayName: 'Basic Logistical Transporter',
    shape: 'full_cube' as const,
    textures: {
      all: 'models/multipart/basic_logistical_transporter.png',
      sides: 'models/multipart/basic_logistical_transporter_vertical.png'
    }
  },
  {
    id: 'mekanism:basic_mechanical_pipe',
    displayName: 'Basic Mechanical Pipe',
    shape: 'full_cube' as const,
    textures: {
      all: 'models/multipart/basic_mechanical_pipe.png',
      sides: 'models/multipart/basic_mechanical_pipe_vertical.png'
    }
  },
  {
    id: 'mekanism:basic_pressurized_tube',
    displayName: 'Basic Pressurized Tube',
    shape: 'full_cube' as const,
    textures: {
      all: 'models/multipart/basic_pressurized_tube.png',
      sides: 'models/multipart/basic_pressurized_tube_vertical.png'
    }
  },
  {
    id: 'mekanism:basic_purifying_factory',
    displayName: 'Basic Purifying Factory',
    shape: 'full_cube' as const,
    textures: {
      all: 'factory/purifying/purifying_factory_front.png'
    }
  },
  {
    id: 'mekanism:basic_sawing_factory',
    displayName: 'Basic Sawing Factory',
    shape: 'full_cube' as const,
    textures: {
      all: 'factory/sawing/sawing_factory_front.png'
    }
  },
  {
    id: 'mekanism:basic_smelting_factory',
    displayName: 'Basic Smelting Factory',
    shape: 'full_cube' as const,
    textures: {
      all: 'factory/smelting/smelting_factory_front.png'
    }
  },
  {
    id: 'mekanism:basic_thermodynamic_conductor',
    displayName: 'Basic Thermodynamic Conductor',
    shape: 'full_cube' as const,
    textures: {
      all: 'models/multipart/basic_thermodynamic_conductor.png',
      sides: 'models/multipart/basic_thermodynamic_conductor_vertical.png'
    }
  },
  {
    id: 'mekanism:basic_universal_cable',
    displayName: 'Basic Universal Cable',
    shape: 'full_cube' as const,
    textures: {
      all: 'models/multipart/basic_universal_cable.png',
      sides: 'models/multipart/basic_universal_cable_vertical.png'
    }
  },
  {
    id: 'mekanism:block_bio_fuel',
    displayName: 'Block Bio Fuel',
    shape: 'full_cube' as const,
    textures: {
      all: 'bio_fuel_block_top.png',
      top: 'bio_fuel_block_top.png',
      bottom: 'bio_fuel_block_bottom.png',
      sides: 'bio_fuel_block_side.png'
    }
  },
  {
    id: 'mekanism:block_bronze',
    displayName: 'Block Bronze',
    shape: 'full_cube' as const,
    textures: {
      all: 'block_bronze.png'
    }
  },
  {
    id: 'mekanism:block_charcoal',
    displayName: 'Block Charcoal',
    shape: 'full_cube' as const,
    textures: {
      all: 'block_charcoal.png'
    }
  },
  {
    id: 'mekanism:block_fluorite',
    displayName: 'Block Fluorite',
    shape: 'full_cube' as const,
    textures: {
      all: 'block_fluorite.png'
    }
  },
  {
    id: 'mekanism:block_refined_glowstone',
    displayName: 'Block Refined Glowstone',
    shape: 'full_cube' as const,
    textures: {
      all: 'block_refined_glowstone.png'
    }
  },
  {
    id: 'mekanism:block_refined_obsidian',
    displayName: 'Block Refined Obsidian',
    shape: 'full_cube' as const,
    textures: {
      all: 'block_refined_obsidian.png'
    }
  },
  {
    id: 'mekanism:block_salt',
    displayName: 'Block Salt',
    shape: 'full_cube' as const,
    textures: {
      all: 'block_salt.png'
    }
  },
  {
    id: 'mekanism:block_steel',
    displayName: 'Block Steel',
    shape: 'full_cube' as const,
    textures: {
      all: 'block_steel.png'
    }
  },
  {
    id: 'mekanism:boiler_casing',
    displayName: 'Boiler Casing',
    shape: 'full_cube' as const,
    textures: {
      all: 'boiler_casing.png'
    }
  },
  {
    id: 'mekanism:boiler_valve',
    displayName: 'Boiler Valve',
    shape: 'full_cube' as const,
    textures: {
      all: 'boiler_valve_input.png'
    }
  },
  {
    id: 'mekanism:bounding_block',
    displayName: 'Bounding Block',
    shape: 'full_cube' as const,
    textures: {
      all: 'steel_casing.png'
    }
  },
  {
    id: 'mekanism:cardboard_box',
    displayName: 'Cardboard Box',
    shape: 'full_cube' as const,
    textures: {
      all: 'cardboard_box_side_storage.png',
      bottom: 'cardboard_box_bottom.png'
    }
  },
  {
    id: 'mekanism:chargepad',
    displayName: 'Chargepad',
    shape: 'full_cube' as const,
    textures: {
      all: 'models/chargepad.png',
      bottom: 'base/base_bottom.png'
    }
  },
  {
    id: 'mekanism:chemical_crystallizer',
    displayName: 'Chemical Crystallizer',
    shape: 'full_cube' as const,
    textures: {
      all: 'models/chemical_crystallizer.png'
    }
  },
  {
    id: 'mekanism:chemical_dissolution_chamber',
    displayName: 'Chemical Dissolution Chamber',
    shape: 'full_cube' as const,
    textures: {
      all: 'bottom.png'
    }
  },
  {
    id: 'mekanism:chemical_infuser',
    displayName: 'Chemical Infuser',
    shape: 'full_cube' as const,
    textures: {
      all: 'models/chemical_infuser.png'
    }
  },
  {
    id: 'mekanism:chemical_injection_chamber',
    displayName: 'Chemical Injection Chamber',
    shape: 'full_cube' as const,
    textures: {
      all: 'chemical_injection_chamber/right.png',
      top: 'chemical_injection_chamber/top.png',
      bottom: 'chemical_injection_chamber/bottom.png',
      sides: 'chemical_injection_chamber/right.png',
      north: 'chemical_injection_chamber/front.png',
      south: 'chemical_injection_chamber/back.png',
      east: 'chemical_injection_chamber/left.png',
      west: 'chemical_injection_chamber/right.png'
    }
  },
  {
    id: 'mekanism:chemical_oxidizer',
    displayName: 'Chemical Oxidizer',
    shape: 'full_cube' as const,
    textures: {
      all: 'models/chemical_oxidizer.png'
    }
  },
  {
    id: 'mekanism:chemical_washer',
    displayName: 'Chemical Washer',
    shape: 'full_cube' as const,
    textures: {
      all: 'models/chemical_washer.png'
    }
  },
  {
    id: 'mekanism:combiner',
    displayName: 'Combiner',
    shape: 'full_cube' as const,
    textures: {
      all: 'combiner/right.png',
      top: 'combiner/top.png',
      bottom: 'combiner/bottom.png',
      sides: 'combiner/right.png',
      north: 'combiner/front.png',
      south: 'combiner/back.png',
      east: 'combiner/left.png',
      west: 'combiner/right.png'
    }
  },
  {
    id: 'mekanism:creative_bin',
    displayName: 'Creative Bin',
    shape: 'full_cube' as const,
    textures: {
      all: 'bin/creative_front.png',
      top: 'bin/creative_top.png',
      bottom: 'bin/bottom.png',
      sides: 'bin/creative_side.png',
      north: 'bin/creative_front.png',
      south: 'bin/creative_back.png'
    }
  },
  {
    id: 'mekanism:creative_chemical_tank',
    displayName: 'Creative Chemical Tank',
    shape: 'full_cube' as const,
    textures: {
      all: 'models/chemical_tank.png'
    }
  },
  {
    id: 'mekanism:creative_energy_cube',
    displayName: 'Creative Energy Cube',
    shape: 'full_cube' as const,
    textures: {
      all: 'energy_cube_particle.png'
    }
  },
  {
    id: 'mekanism:creative_fluid_tank',
    displayName: 'Creative Fluid Tank',
    shape: 'full_cube' as const,
    textures: {
      all: 'models/fluid_tank_side_off.png'
    }
  },
  {
    id: 'mekanism:crusher',
    displayName: 'Crusher',
    shape: 'full_cube' as const,
    textures: {
      all: 'crusher/side.png',
      top: 'crusher/top.png',
      bottom: 'crusher/bottom.png',
      sides: 'crusher/side.png',
      north: 'crusher/front.png',
      south: 'crusher/back.png',
      east: 'crusher/side.png',
      west: 'crusher/side.png'
    }
  },
  {
    id: 'mekanism:digital_miner',
    displayName: 'Digital Miner',
    shape: 'full_cube' as const,
    textures: {
      all: 'models/digital_miner.png'
    }
  },
  {
    id: 'mekanism:diversion_transporter',
    displayName: 'Diversion Transporter',
    shape: 'full_cube' as const,
    textures: {
      all: 'models/multipart/diversion_transporter.png',
      sides: 'models/multipart/diversion_transporter_vertical.png'
    }
  },
  {
    id: 'mekanism:dynamic_tank',
    displayName: 'Dynamic Tank',
    shape: 'full_cube' as const,
    textures: {
      all: 'dynamic_tank.png'
    }
  },
  {
    id: 'mekanism:dynamic_valve',
    displayName: 'Dynamic Valve',
    shape: 'full_cube' as const,
    textures: {
      all: 'dynamic_valve.png'
    }
  },
  {
    id: 'mekanism:electric_pump',
    displayName: 'Electric Pump',
    shape: 'full_cube' as const,
    textures: {
      all: 'steel_casing.png'
    }
  },
  {
    id: 'mekanism:electrolytic_separator',
    displayName: 'Electrolytic Separator',
    shape: 'full_cube' as const,
    textures: {
      all: 'steel_casing.png'
    }
  },
  {
    id: 'mekanism:elite_bin',
    displayName: 'Elite Bin',
    shape: 'full_cube' as const,
    textures: {
      all: 'bin/front.png',
      top: 'bin/top.png',
      bottom: 'bin/bottom.png',
      sides: 'bin/elite_side.png',
      north: 'bin/front.png',
      south: 'bin/elite_back.png'
    }
  },
  {
    id: 'mekanism:elite_chemical_tank',
    displayName: 'Elite Chemical Tank',
    shape: 'full_cube' as const,
    textures: {
      all: 'models/chemical_tank.png'
    }
  },
  {
    id: 'mekanism:elite_combining_factory',
    displayName: 'Elite Combining Factory',
    shape: 'full_cube' as const,
    textures: {
      all: 'factory/combining/combining_factory_front.png'
    }
  },
  {
    id: 'mekanism:elite_compressing_factory',
    displayName: 'Elite Compressing Factory',
    shape: 'full_cube' as const,
    textures: {
      all: 'factory/compressing/compressing_factory_front.png'
    }
  },
  {
    id: 'mekanism:elite_crushing_factory',
    displayName: 'Elite Crushing Factory',
    shape: 'full_cube' as const,
    textures: {
      all: 'factory/crushing/crushing_factory_front.png'
    }
  },
  {
    id: 'mekanism:elite_energy_cube',
    displayName: 'Elite Energy Cube',
    shape: 'full_cube' as const,
    textures: {
      all: 'energy_cube_particle.png'
    }
  },
  {
    id: 'mekanism:elite_enriching_factory',
    displayName: 'Elite Enriching Factory',
    shape: 'full_cube' as const,
    textures: {
      all: 'factory/enriching/enriching_factory_front.png'
    }
  },
  {
    id: 'mekanism:elite_fluid_tank',
    displayName: 'Elite Fluid Tank',
    shape: 'full_cube' as const,
    textures: {
      all: 'models/fluid_tank_side_off.png'
    }
  },
  {
    id: 'mekanism:elite_induction_cell',
    displayName: 'Elite Induction Cell',
    shape: 'full_cube' as const,
    textures: {
      all: 'elite_induction_cell.png'
    }
  },
  {
    id: 'mekanism:elite_induction_provider',
    displayName: 'Elite Induction Provider',
    shape: 'full_cube' as const,
    textures: {
      all: 'elite_induction_provider.png'
    }
  },
  {
    id: 'mekanism:elite_infusing_factory',
    displayName: 'Elite Infusing Factory',
    shape: 'full_cube' as const,
    textures: {
      all: 'factory/infusing/infusing_factory_front.png'
    }
  },
  {
    id: 'mekanism:elite_injecting_factory',
    displayName: 'Elite Injecting Factory',
    shape: 'full_cube' as const,
    textures: {
      all: 'factory/injecting/injecting_factory_front.png'
    }
  },
  {
    id: 'mekanism:elite_logistical_transporter',
    displayName: 'Elite Logistical Transporter',
    shape: 'full_cube' as const,
    textures: {
      all: 'models/multipart/elite_logistical_transporter.png',
      sides: 'models/multipart/elite_logistical_transporter_vertical.png'
    }
  },
  {
    id: 'mekanism:elite_mechanical_pipe',
    displayName: 'Elite Mechanical Pipe',
    shape: 'full_cube' as const,
    textures: {
      all: 'models/multipart/elite_mechanical_pipe.png',
      sides: 'models/multipart/elite_mechanical_pipe_vertical.png'
    }
  },
  {
    id: 'mekanism:elite_pressurized_tube',
    displayName: 'Elite Pressurized Tube',
    shape: 'full_cube' as const,
    textures: {
      all: 'models/multipart/elite_pressurized_tube.png',
      sides: 'models/multipart/elite_pressurized_tube_vertical.png'
    }
  },
  {
    id: 'mekanism:elite_purifying_factory',
    displayName: 'Elite Purifying Factory',
    shape: 'full_cube' as const,
    textures: {
      all: 'factory/purifying/purifying_factory_front.png'
    }
  },
  {
    id: 'mekanism:elite_sawing_factory',
    displayName: 'Elite Sawing Factory',
    shape: 'full_cube' as const,
    textures: {
      all: 'factory/sawing/sawing_factory_front.png'
    }
  },
  {
    id: 'mekanism:elite_smelting_factory',
    displayName: 'Elite Smelting Factory',
    shape: 'full_cube' as const,
    textures: {
      all: 'factory/smelting/smelting_factory_front.png'
    }
  },
  {
    id: 'mekanism:elite_thermodynamic_conductor',
    displayName: 'Elite Thermodynamic Conductor',
    shape: 'full_cube' as const,
    textures: {
      all: 'models/multipart/elite_thermodynamic_conductor.png',
      sides: 'models/multipart/elite_thermodynamic_conductor_vertical.png'
    }
  },
  {
    id: 'mekanism:elite_universal_cable',
    displayName: 'Elite Universal Cable',
    shape: 'full_cube' as const,
    textures: {
      all: 'models/multipart/elite_universal_cable.png',
      sides: 'models/multipart/elite_universal_cable_vertical.png'
    }
  },
  {
    id: 'mekanism:energized_smelter',
    displayName: 'Energized Smelter',
    shape: 'full_cube' as const,
    textures: {
      all: 'energized_smelter/side.png',
      top: 'energized_smelter/top.png',
      bottom: 'energized_smelter/bottom.png',
      sides: 'energized_smelter/side.png',
      north: 'energized_smelter/front.png',
      south: 'energized_smelter/back.png',
      east: 'energized_smelter/side.png',
      west: 'energized_smelter/side.png'
    }
  },
  {
    id: 'mekanism:enrichment_chamber',
    displayName: 'Enrichment Chamber',
    shape: 'full_cube' as const,
    textures: {
      all: 'enrichment_chamber/right.png',
      top: 'enrichment_chamber/top.png',
      bottom: 'enrichment_chamber/bottom.png',
      sides: 'enrichment_chamber/right.png',
      north: 'enrichment_chamber/front.png',
      south: 'enrichment_chamber/back.png',
      east: 'enrichment_chamber/left.png',
      west: 'enrichment_chamber/right.png'
    }
  },
  {
    id: 'mekanism:fluidic_plenisher',
    displayName: 'Fluidic Plenisher',
    shape: 'full_cube' as const,
    textures: {
      all: 'models/fluidic_plenisher.png'
    }
  },
  {
    id: 'mekanism:formulaic_assemblicator',
    displayName: 'Formulaic Assemblicator',
    shape: 'full_cube' as const,
    textures: {
      all: 'formulaic_assemblicator/right.png',
      top: 'formulaic_assemblicator/top.png',
      bottom: 'formulaic_assemblicator/bottom.png',
      sides: 'formulaic_assemblicator/right.png',
      north: 'formulaic_assemblicator/front.png',
      south: 'formulaic_assemblicator/back.png',
      east: 'formulaic_assemblicator/left.png',
      west: 'formulaic_assemblicator/right.png'
    }
  },
  {
    id: 'mekanism:fuelwood_heater',
    displayName: 'Fuelwood Heater',
    shape: 'full_cube' as const,
    textures: {
      all: 'fuelwood_heater/right.png',
      top: 'fuelwood_heater/top.png',
      bottom: 'fuelwood_heater/bottom.png',
      sides: 'fuelwood_heater/right.png',
      north: 'fuelwood_heater/front.png',
      south: 'fuelwood_heater/back.png',
      east: 'fuelwood_heater/left.png',
      west: 'fuelwood_heater/right.png'
    }
  },
  {
    id: 'mekanism:induction_casing',
    displayName: 'Induction Casing',
    shape: 'full_cube' as const,
    textures: {
      all: 'induction_casing.png'
    }
  },
  {
    id: 'mekanism:induction_port',
    displayName: 'Induction Port',
    shape: 'full_cube' as const,
    textures: {
      all: 'induction_port.png'
    }
  },
  {
    id: 'mekanism:industrial_alarm',
    displayName: 'Industrial Alarm',
    shape: 'full_cube' as const,
    textures: {
      all: 'steel_casing.png'
    }
  },
  {
    id: 'mekanism:isotopic_centrifuge',
    displayName: 'Isotopic Centrifuge',
    shape: 'full_cube' as const,
    textures: {
      all: 'models/isotopic_centrifuge.png'
    }
  },
  {
    id: 'mekanism:laser',
    displayName: 'Laser',
    shape: 'full_cube' as const,
    textures: {
      all: 'models/laser.png'
    }
  },
  {
    id: 'mekanism:laser_amplifier',
    displayName: 'Laser Amplifier',
    shape: 'full_cube' as const,
    textures: {
      all: 'models/laser_device_frame.png'
    }
  },
  {
    id: 'mekanism:laser_tractor_beam',
    displayName: 'Laser Tractor Beam',
    shape: 'full_cube' as const,
    textures: {
      all: 'models/laser_device_frame.png'
    }
  },
  {
    id: 'mekanism:logistical_sorter',
    displayName: 'Logistical Sorter',
    shape: 'full_cube' as const,
    textures: {
      all: 'models/logistical_sorter.png'
    }
  },
  {
    id: 'mekanism:metallurgic_infuser',
    displayName: 'Metallurgic Infuser',
    shape: 'full_cube' as const,
    textures: {
      all: 'models/metallurgic_infuser.png'
    }
  },
  {
    id: 'mekanism:modification_station',
    displayName: 'Modification Station',
    shape: 'full_cube' as const,
    textures: {
      all: 'models/modification_station.png'
    }
  },
  {
    id: 'mekanism:nutritional_liquifier',
    displayName: 'Nutritional Liquifier',
    shape: 'full_cube' as const,
    textures: {
      all: 'nutritional_liquifier.png'
    }
  },
  {
    id: 'mekanism:oredictionificator',
    displayName: 'Oredictionificator',
    shape: 'full_cube' as const,
    textures: {
      all: 'oredictionificator/right.png',
      top: 'oredictionificator/top.png',
      bottom: 'oredictionificator/bottom.png',
      sides: 'oredictionificator/right.png',
      north: 'oredictionificator/front.png',
      south: 'oredictionificator/back.png',
      east: 'oredictionificator/left.png',
      west: 'oredictionificator/right.png'
    }
  },
  {
    id: 'mekanism:osmium_compressor',
    displayName: 'Osmium Compressor',
    shape: 'full_cube' as const,
    textures: {
      all: 'osmium_compressor/right.png',
      top: 'osmium_compressor/top.png',
      bottom: 'osmium_compressor/bottom.png',
      sides: 'osmium_compressor/right.png',
      north: 'osmium_compressor/front.png',
      south: 'osmium_compressor/back.png',
      east: 'osmium_compressor/left.png',
      west: 'osmium_compressor/right.png'
    }
  },
  {
    id: 'mekanism:painting_machine',
    displayName: 'Painting Machine',
    shape: 'full_cube' as const,
    textures: {
      all: 'painting_machine/right.png',
      top: 'painting_machine/top.png',
      bottom: 'painting_machine/bottom.png',
      sides: 'painting_machine/right.png',
      north: 'painting_machine/front.png',
      south: 'painting_machine/back.png',
      east: 'painting_machine/left.png',
      west: 'painting_machine/right.png'
    }
  },
  {
    id: 'mekanism:personal_chest',
    displayName: 'Personal Chest',
    shape: 'full_cube' as const,
    textures: {
      all: 'steel_casing.png'
    }
  },
  {
    id: 'mekanism:pigment_extractor',
    displayName: 'Pigment Extractor',
    shape: 'full_cube' as const,
    textures: {
      all: 'pigment_extractor/right.png',
      top: 'pigment_extractor/top.png',
      bottom: 'pigment_extractor/bottom.png',
      sides: 'pigment_extractor/right.png',
      north: 'pigment_extractor/front.png',
      south: 'pigment_extractor/back.png',
      east: 'pigment_extractor/left.png',
      west: 'pigment_extractor/right.png'
    }
  },
  {
    id: 'mekanism:pigment_mixer',
    displayName: 'Pigment Mixer',
    shape: 'full_cube' as const,
    textures: {
      all: 'pigment_mixer/base.png'
    }
  },
  {
    id: 'mekanism:precision_sawmill',
    displayName: 'Precision Sawmill',
    shape: 'full_cube' as const,
    textures: {
      all: 'precision_sawmill/right.png',
      top: 'precision_sawmill/top.png',
      bottom: 'precision_sawmill/bottom.png',
      sides: 'precision_sawmill/right.png',
      north: 'precision_sawmill/front.png',
      south: 'precision_sawmill/back.png',
      east: 'precision_sawmill/left.png',
      west: 'precision_sawmill/right.png'
    }
  },
  {
    id: 'mekanism:pressure_disperser',
    displayName: 'Pressure Disperser',
    shape: 'full_cube' as const,
    textures: {
      all: 'pressure_disperser.png'
    }
  },
  {
    id: 'mekanism:pressurized_reaction_chamber',
    displayName: 'Pressurized Reaction Chamber',
    shape: 'full_cube' as const,
    textures: {
      all: 'models/pressurized_reaction_chamber.png'
    }
  },
  {
    id: 'mekanism:purification_chamber',
    displayName: 'Purification Chamber',
    shape: 'full_cube' as const,
    textures: {
      all: 'purification_chamber/right.png',
      top: 'purification_chamber/top.png',
      bottom: 'purification_chamber/bottom.png',
      sides: 'purification_chamber/right.png',
      north: 'purification_chamber/front.png',
      south: 'purification_chamber/back.png',
      east: 'purification_chamber/left.png',
      west: 'purification_chamber/right.png'
    }
  },
  {
    id: 'mekanism:qio_dashboard',
    displayName: 'Qio Dashboard',
    shape: 'full_cube' as const,
    textures: {
      all: 'models/qio_dashboard.png'
    }
  },
  {
    id: 'mekanism:qio_drive_array',
    displayName: 'Qio Drive Array',
    shape: 'full_cube' as const,
    textures: {
      all: 'qio_drive_array/top.png'
    }
  },
  {
    id: 'mekanism:qio_exporter',
    displayName: 'Qio Exporter',
    shape: 'full_cube' as const,
    textures: {
      all: 'models/qio_bus.png'
    }
  },
  {
    id: 'mekanism:qio_importer',
    displayName: 'Qio Importer',
    shape: 'full_cube' as const,
    textures: {
      all: 'models/qio_bus.png'
    }
  },
  {
    id: 'mekanism:qio_redstone_adapter',
    displayName: 'Qio Redstone Adapter',
    shape: 'full_cube' as const,
    textures: {
      all: 'models/qio_bus.png'
    }
  },
  {
    id: 'mekanism:quantum_entangloporter',
    displayName: 'Quantum Entangloporter',
    shape: 'full_cube' as const,
    textures: {
      all: 'models/quantum_entangloporter.png'
    }
  },
  {
    id: 'mekanism:radioactive_waste_barrel',
    displayName: 'Radioactive Waste Barrel',
    shape: 'full_cube' as const,
    textures: {
      all: 'models/radioactive_waste_barrel.png'
    }
  },
  {
    id: 'mekanism:resistive_heater',
    displayName: 'Resistive Heater',
    shape: 'full_cube' as const,
    textures: {
      all: 'models/resistive_heater_sides_2.png'
    }
  },
  {
    id: 'mekanism:restrictive_transporter',
    displayName: 'Restrictive Transporter',
    shape: 'full_cube' as const,
    textures: {
      all: 'models/multipart/restrictive_transporter.png',
      sides: 'models/multipart/restrictive_transporter_vertical.png'
    }
  },
  {
    id: 'mekanism:rotary_condensentrator',
    displayName: 'Rotary Condensentrator',
    shape: 'full_cube' as const,
    textures: {
      all: 'models/rotary_condensentrator.png'
    }
  },
  {
    id: 'mekanism:security_desk',
    displayName: 'Security Desk',
    shape: 'full_cube' as const,
    textures: {
      all: 'models/security_desk_base.png'
    }
  },
  {
    id: 'mekanism:seismic_vibrator',
    displayName: 'Seismic Vibrator',
    shape: 'full_cube' as const,
    textures: {
      all: 'models/seismic_vibrator_1.png'
    }
  },
  {
    id: 'mekanism:solar_neutron_activator',
    displayName: 'Solar Neutron Activator',
    shape: 'full_cube' as const,
    textures: {
      all: 'models/solar_neutron_activator1.png'
    }
  },
  {
    id: 'mekanism:sps_casing',
    displayName: 'Sps Casing',
    shape: 'full_cube' as const,
    textures: {
      all: 'sps_casing.png'
    }
  },
  {
    id: 'mekanism:sps_port',
    displayName: 'Sps Port',
    shape: 'full_cube' as const,
    textures: {
      all: 'sps_port.png'
    }
  },
  {
    id: 'mekanism:steel_casing',
    displayName: 'Steel Casing',
    shape: 'full_cube' as const,
    textures: {
      all: 'steel_casing.png'
    }
  },
  {
    id: 'mekanism:structural_glass',
    displayName: 'Structural Glass',
    shape: 'full_cube' as const,
    textures: {
      all: 'structural_glass.png'
    },
    transparent: true,
    renderType: 'cutout' as const
  },
  {
    id: 'mekanism:supercharged_coil',
    displayName: 'Supercharged Coil',
    shape: 'full_cube' as const,
    textures: {
      all: 'steel_casing.png'
    }
  },
  {
    id: 'mekanism:superheating_element',
    displayName: 'Superheating Element',
    shape: 'full_cube' as const,
    textures: {
      all: 'superheating_element.png'
    }
  },
  {
    id: 'mekanism:teleporter',
    displayName: 'Teleporter',
    shape: 'full_cube' as const,
    textures: {
      all: 'teleporter.png'
    }
  },
  {
    id: 'mekanism:teleporter_frame',
    displayName: 'Teleporter Frame',
    shape: 'full_cube' as const,
    textures: {
      all: 'teleporter_frame.png'
    }
  },
  {
    id: 'mekanism:thermal_evaporation_block',
    displayName: 'Thermal Evaporation Block',
    shape: 'full_cube' as const,
    textures: {
      top: 'thermal_evaporation_block_top.png',
      bottom: 'thermal_evaporation_block_top.png',
      sides: 'thermal_evaporation_block.png'
    }
  },
  {
    id: 'mekanism:thermal_evaporation_controller',
    displayName: 'Thermal Evaporation Controller',
    shape: 'full_cube' as const,
    textures: {
      all: 'thermal_evaporation_block.png',
      top: 'thermal_evaporation_block.png',
      bottom: 'thermal_evaporation_block.png',
      sides: 'thermal_evaporation_block.png',
      north: 'thermal_evaporation_controller.png',
      south: 'thermal_evaporation_block.png',
      east: 'thermal_evaporation_block.png',
      west: 'thermal_evaporation_block.png'
    }
  },
  {
    id: 'mekanism:thermal_evaporation_valve',
    displayName: 'Thermal Evaporation Valve',
    shape: 'full_cube' as const,
    textures: {
      all: 'thermal_evaporation_valve.png'
    }
  },
  {
    id: 'mekanism:ultimate_bin',
    displayName: 'Ultimate Bin',
    shape: 'full_cube' as const,
    textures: {
      all: 'bin/front.png',
      top: 'bin/top.png',
      bottom: 'bin/bottom.png',
      sides: 'bin/ultimate_side.png',
      north: 'bin/front.png',
      south: 'bin/ultimate_back.png'
    }
  },
  {
    id: 'mekanism:ultimate_chemical_tank',
    displayName: 'Ultimate Chemical Tank',
    shape: 'full_cube' as const,
    textures: {
      all: 'models/chemical_tank.png'
    }
  },
  {
    id: 'mekanism:ultimate_combining_factory',
    displayName: 'Ultimate Combining Factory',
    shape: 'full_cube' as const,
    textures: {
      all: 'factory/combining/combining_factory_front.png'
    }
  },
  {
    id: 'mekanism:ultimate_compressing_factory',
    displayName: 'Ultimate Compressing Factory',
    shape: 'full_cube' as const,
    textures: {
      all: 'factory/compressing/compressing_factory_front.png'
    }
  },
  {
    id: 'mekanism:ultimate_crushing_factory',
    displayName: 'Ultimate Crushing Factory',
    shape: 'full_cube' as const,
    textures: {
      all: 'factory/crushing/crushing_factory_front.png'
    }
  },
  {
    id: 'mekanism:ultimate_energy_cube',
    displayName: 'Ultimate Energy Cube',
    shape: 'full_cube' as const,
    textures: {
      all: 'energy_cube_particle.png'
    }
  },
  {
    id: 'mekanism:ultimate_enriching_factory',
    displayName: 'Ultimate Enriching Factory',
    shape: 'full_cube' as const,
    textures: {
      all: 'factory/enriching/enriching_factory_front.png'
    }
  },
  {
    id: 'mekanism:ultimate_fluid_tank',
    displayName: 'Ultimate Fluid Tank',
    shape: 'full_cube' as const,
    textures: {
      all: 'models/fluid_tank_side_off.png'
    }
  },
  {
    id: 'mekanism:ultimate_induction_cell',
    displayName: 'Ultimate Induction Cell',
    shape: 'full_cube' as const,
    textures: {
      all: 'ultimate_induction_cell.png'
    }
  },
  {
    id: 'mekanism:ultimate_induction_provider',
    displayName: 'Ultimate Induction Provider',
    shape: 'full_cube' as const,
    textures: {
      all: 'ultimate_induction_provider.png'
    }
  },
  {
    id: 'mekanism:ultimate_infusing_factory',
    displayName: 'Ultimate Infusing Factory',
    shape: 'full_cube' as const,
    textures: {
      all: 'factory/infusing/infusing_factory_front.png'
    }
  },
  {
    id: 'mekanism:ultimate_injecting_factory',
    displayName: 'Ultimate Injecting Factory',
    shape: 'full_cube' as const,
    textures: {
      all: 'factory/injecting/injecting_factory_front.png'
    }
  },
  {
    id: 'mekanism:ultimate_logistical_transporter',
    displayName: 'Ultimate Logistical Transporter',
    shape: 'full_cube' as const,
    textures: {
      all: 'models/multipart/ultimate_logistical_transporter.png',
      sides: 'models/multipart/ultimate_logistical_transporter_vertical.png'
    }
  },
  {
    id: 'mekanism:ultimate_mechanical_pipe',
    displayName: 'Ultimate Mechanical Pipe',
    shape: 'full_cube' as const,
    textures: {
      all: 'models/multipart/ultimate_mechanical_pipe.png',
      sides: 'models/multipart/ultimate_mechanical_pipe_vertical.png'
    }
  },
  {
    id: 'mekanism:ultimate_pressurized_tube',
    displayName: 'Ultimate Pressurized Tube',
    shape: 'full_cube' as const,
    textures: {
      all: 'models/multipart/ultimate_pressurized_tube.png',
      sides: 'models/multipart/ultimate_pressurized_tube_vertical.png'
    }
  },
  {
    id: 'mekanism:ultimate_purifying_factory',
    displayName: 'Ultimate Purifying Factory',
    shape: 'full_cube' as const,
    textures: {
      all: 'factory/purifying/purifying_factory_front.png'
    }
  },
  {
    id: 'mekanism:ultimate_sawing_factory',
    displayName: 'Ultimate Sawing Factory',
    shape: 'full_cube' as const,
    textures: {
      all: 'factory/sawing/sawing_factory_front.png'
    }
  },
  {
    id: 'mekanism:ultimate_smelting_factory',
    displayName: 'Ultimate Smelting Factory',
    shape: 'full_cube' as const,
    textures: {
      all: 'factory/smelting/smelting_factory_front.png'
    }
  },
  {
    id: 'mekanism:ultimate_thermodynamic_conductor',
    displayName: 'Ultimate Thermodynamic Conductor',
    shape: 'full_cube' as const,
    textures: {
      all: 'models/multipart/ultimate_thermodynamic_conductor.png',
      sides: 'models/multipart/ultimate_thermodynamic_conductor_vertical.png'
    }
  },
  {
    id: 'mekanism:ultimate_universal_cable',
    displayName: 'Ultimate Universal Cable',
    shape: 'full_cube' as const,
    textures: {
      all: 'models/multipart/ultimate_universal_cable.png',
      sides: 'models/multipart/ultimate_universal_cable_vertical.png'
    }
  }
  ]
};

export default mekanismMod;
