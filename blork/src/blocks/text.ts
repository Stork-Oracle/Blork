/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly/core';
import { Block } from 'blockly/core';

// Add these type imports
export interface CustomBlock extends Block {
  getSourceType_: (sourceType?: string) => void;
  getIDOptions_: (workspace: Blockly.Workspace) => [string, string][];
}

// Main configuration block
const mainConfig = {
  type: 'main_config',
  message0: 'Configuration %1 Sources %2 Transformations %3',
  args0: [
    {
      type: 'input_dummy'
    },
    {
      type: 'input_statement',
      name: 'SOURCES',
      check: 'Source'  // Only allow source blocks
    },
    {
      type: 'input_statement',
      name: 'TRANSFORMATIONS',
      check: 'Transformation'  // Only allow transformation blocks
    }
  ],
  colour: '#001240',
  tooltip: 'Main configuration container',
}

// Transformation block
const transformation = {
  type: 'transformation',
  message0: 'Transformation\nID: %1\nValues: %2',
  args0: [
    {
      type: 'field_input',
      name: 'ID',
      text: 'id'
    },
    {
      type: 'input_value',
      name: 'VALUES',
    }
  ],
  previousStatement: 'Transformation',
  nextStatement: 'Transformation',
  inputsInline: false,
  colour: '#ff6533',
  tooltip: 'Define a transformation\n(use no aggregation when doing arithmetic)'
}

const aggregation = {
  type: 'aggregation',
  message0: 'Agg Formula: %1 \nValues: %2',
  args0: [
    {
      type: 'field_dropdown',
      name: 'FORMULA',
      options: [
        ['Median', 'median'],
        ['Mean', 'mean'],
        ['Mode', 'mode'],
        ['Sum', 'sum'],
        ['Prod', 'prod'],
      ]
    },
    {
      type: 'input_statement',
      name: 'VALUES',
    }
  ],
  output: null,
  colour: '#6666ff',
  tooltip: 'Define an aggregation'
}

// Operation block
const simpleFormula = {
  type: 'simple_formula',
  message0: 'Math: %1 %2 %3',
  args0: [
    {
      type: 'input_value',
      name: 'VALUE_A',
    },
    {
      type: 'field_dropdown',
      name: 'OPERATION',
      options: [
        ['+', '+'],
        ['-', '-'],
        ['×', '×'],
        ['÷', '÷'],
        ['^', '^']
      ]
    },
    {
      type: 'input_value',
      name: 'VALUE_B',
    },
  ],
  output: null,
  colour: '#6666ff',
  tooltip: 'Define an simple formula',
  "inputsInline": true
}

const constant = {
  type: 'constant',
  message0: 'Num %1',
  args0: [
    {
      type: 'field_input',
      name: 'INPUT',
      text: '123.0',
    }
  ],
  output: null,
  colour: '#6666ff',
  tooltip: 'Define a constant',
}

const value = {
  type: 'value',
  message0: 'Value %1',
  args0: [
    {
      type: 'input_value',
      name: 'INPUT',
    }
  ],
  previousStatement: 'value',
  nextStatement: 'value',
  colour: '#ff6533',
  tooltip: 'Wrap your formulas to list the it as a value',
}

// Variable block, dynamically updates via 
Blockly.Blocks['variable'] = {
  init: function() {
    this.appendDummyInput()
      .appendField("Variable: ")
      .appendField(new Blockly.FieldDropdown(() => this.getIDOptions_(this.workspace)), "NAME");
    
    this.setOutput(true, "Source");
    // this.setNextStatement(true, "Source");
    this.setColour('#6666ff');
    this.setTooltip('Define a variable (e.g. SOURCE_ID)');
  },

  getIDOptions_: function(workspace: Blockly.Workspace): [string, string][] {
    const idSet = new Set<string>();
    const allBlocks = workspace.getAllBlocks(false);
  
    allBlocks.forEach(block => {
      if (block.type === 'transformation' || block.type === 'source') {
        const id = block.getFieldValue('ID');
        if (id) {
          idSet.add(id);
        }
      }
    });
  
    return Array.from(idSet).map(id => [id, id]);
  }
}

// Source block, registered directly so it can be dynamically updated
Blockly.Blocks['source'] = {
  init: function() {
    this.appendDummyInput()
      .appendField("Source")

    this.appendDummyInput()
      .appendField("ID: ")
      .appendField(new Blockly.FieldTextInput("id"), "ID");
    
    this.appendDummyInput()
      .appendField("Data Source: ")
      .appendField(new Blockly.FieldDropdown(
        [
          ['Dummy', 'dummy'],
          ['Uniswap V2', 'uniswapv2'],
          ['Raydium CLMM', 'raydiumclmm'],
          ['Random', 'random']
        ],
        function(this: Blockly.FieldDropdown, value: string) {
          const block = this.getSourceBlock() as CustomBlock;
          block.getSourceType_(value);
          return value;
        }
      ), "DATA_SOURCE");
    
    this.appendDummyInput()
      .appendField("Update Frequency: ")
      .appendField(new Blockly.FieldTextInput("5s"), "UPDATE_FREQUENCY");
    
    this.setPreviousStatement(true, "Source");
    this.setNextStatement(true, "Source");
    this.setColour('#ff6533');
    this.setTooltip("Define a data source");
  },

  getSourceType_: function(sourceType?: string) {
    sourceType = sourceType || this.getFieldValue('DATA_SOURCE');
    
    // Remove old config fields
    this.inputList
      .filter((input: Blockly.Input) => input.name.startsWith('CONFIG_'))
      .forEach((input: Blockly.Input) => this.removeInput(input.name));

    // Add new config fields based on source type
    switch(sourceType) {
      case 'dummy':
        break;
      case 'uniswapv2':
        this.appendDummyInput('CONFIG_CONTRACT')
          .appendField('Contract:')
          .appendField(new Blockly.FieldTextInput('0x...'), 'CONTRACT');
        this.appendDummyInput('CONFIG_PROVIDER')
          .appendField('Provider URL:')
          .appendField(new Blockly.FieldTextInput('https://'), 'PROVIDER_URL');
        this.appendDummyInput('CONFIG_INDICES')
          .appendField('Base Token Index:')
          .appendField(new Blockly.FieldNumber(0), 'BASE_INDEX')
          .appendField('Quote Token Index:')
          .appendField(new Blockly.FieldNumber(1), 'QUOTE_INDEX');
        break;
      
      case 'raydiumclmm':
        this.appendDummyInput('CONFIG_CONTRACT')
          .appendField('Contract:')
          .appendField(new Blockly.FieldTextInput(''), 'CONTRACT');
        this.appendDummyInput('CONFIG_PROVIDER')
          .appendField('Provider URL:')
          .appendField(new Blockly.FieldTextInput('https://'), 'PROVIDER_URL');
        break;
      
      case 'random':
        this.appendDummyInput('CONFIG_MIN')
          .appendField('Min Value:')
          .appendField(new Blockly.FieldNumber(0), 'MIN_VALUE');
        this.appendDummyInput('CONFIG_MAX')
          .appendField('Max Value:')
          .appendField(new Blockly.FieldNumber(100), 'MAX_VALUE');
        break;
    }
  }
};

// Register the blocks
export const blocks = Blockly.common.createBlockDefinitionsFromJsonArray([
  mainConfig,
  transformation,
  aggregation,
  simpleFormula,
  value,
  constant
]);
