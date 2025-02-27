/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly';
import {blocks} from './blocks/text';
import {forBlock} from './generators/javascript';
import {javascriptGenerator} from 'blockly/javascript';
import {toolbox} from './toolbox';
import './index.css';

// Register the blocks and generator with Blockly
Blockly.common.defineBlocks(blocks);

Object.assign(javascriptGenerator.forBlock, forBlock);

// Set up UI elements and inject Blockly
const codeDiv = document.querySelector('#generatedCode');
const codePreElement = document.createElement('pre');
const codeElement = document.createElement('code');
codePreElement.appendChild(codeElement);
if (codeDiv) {
  codeDiv.appendChild(codePreElement);
}
const outputDiv = document.getElementById('output');
const blocklyDiv = document.getElementById('blocklyDiv');

if (!blocklyDiv) {
  throw new Error(`div with id 'blocklyDiv' not found`);
}

const ws = Blockly.inject(blocklyDiv, {
  toolbox,
  theme: {
    name: 'custom',
    componentStyles: {
      workspaceBackgroundColour: '#B1FCF3',
      flyoutBackgroundColour: '#001240',
      flyoutOpacity: 1.0,
    },
  },
});

// This function resets the code and output divs, shows the
// generated code from the workspace, and evals the code.
const runCode = () => {
  const mainBlock = ws.getBlocksByType('main_config')[0];
  if (!mainBlock) return;

  const code = javascriptGenerator.blockToCode(mainBlock);
  
  // TODO: add custom json validation
  try {
    // Parse the generated code as JSON to validate it
    const jsonConfig = JSON.parse(code as string);
    
    // Display formatted JSON
    if (codeElement) {
      codeElement.textContent = JSON.stringify(jsonConfig, null, 2);
    }

    // Clear previous output
    if (outputDiv) {
      outputDiv.innerHTML = '';
    }
    
  } catch (e) {
    console.error('Invalid JSON generated:', e);
    if (codeElement) {
      codeElement.textContent = 'Error: Invalid JSON generated';
    }
  }
};

function createBlock(
  workspace: Blockly.WorkspaceSvg, 
  type: string, 
  fieldValues?: { [key: string]: string | number }
): Blockly.Block {
  const block = workspace.newBlock(type);
  
  // Optionally set the field values
  if (fieldValues) {
    Object.entries(fieldValues).forEach(([fieldName, value]) => {
      const field = block.getField(fieldName);
      if (field) {
        field.setValue(value);
      }
    });
  }
  
  block.initSvg();
  block.render();
  return block;
}

function connectBlocks(
  sourceBlock: Blockly.Block,
  targetBlock: Blockly.Block,
  connectionType: 'input' | 'next',
  inputName?: string
) {
  // Horizontal connection
  if (connectionType === 'input' && inputName) {
    const inputPort = sourceBlock.getInput(inputName);
    if (inputPort?.connection && targetBlock.previousConnection) {
      inputPort.connection.connect(targetBlock.previousConnection);
    } else if (inputPort?.connection && targetBlock.outputConnection) {
      inputPort.connection.connect(targetBlock.outputConnection);
    }
  // Vertical connection
  } else if (connectionType === 'next') {
    const nextConnection = sourceBlock.nextConnection;
    const previousConnection = targetBlock.previousConnection;
    if (nextConnection && previousConnection) {
      nextConnection.connect(previousConnection);
    }
  }
}

export function initWorkspace(ws: Blockly.WorkspaceSvg) {
  const mainBlock = createBlock(ws, 'main_config');
  mainBlock.setDeletable(false);
  mainBlock.moveBy(50, 50);

  const sourceBlock = createBlock(ws, 'source', { 
    'ID': 'WETHUSDT',
    'DATA_SOURCE': 'uniswapv2',
    'PROVIDER_URL': 'https://ethereum-rpc.publicnode.com',
    'CONTRACT': '0x0d4a11d5eeaac28ec3f61d100daf4d40471f1852',
    'QUOTE_DECIMALS': 6
  });
  const sourceBlockB = createBlock(ws, 'source', {
    'ID': 'SOL_USDC',
    'DATA_SOURCE': 'raydiumclmm',
    'PROVIDER_URL': 'https://solana-rpc.publicnode.com',
    'CONTRACT': '8sLbNZoA1cfnvMJLPfp98ZLAnFSYCFApfJKMbiXNLwxj',
  });

  connectBlocks(mainBlock, sourceBlock, 'input', 'SOURCES');
  connectBlocks(sourceBlock, sourceBlockB, 'next');

  const transformationBlockA = createBlock(ws, 'transformation', { 'ID': 'SOL_WETH_MEDIAN' });
  const transformationBlockB = createBlock(ws, 'transformation', { 'ID': 'USDC_SOL' });

  connectBlocks(mainBlock, transformationBlockA, 'input', 'TRANSFORMATIONS');
  connectBlocks(transformationBlockA, transformationBlockB, 'next');

  const aggregationBlock = createBlock(ws, 'aggregation');
  connectBlocks(transformationBlockA, aggregationBlock, 'input', 'VALUES');

  const valueBlock = createBlock(ws, 'value');
  const valueBlockB = createBlock(ws, 'value');
  connectBlocks(aggregationBlock, valueBlock, 'input', 'VALUES');
  connectBlocks(valueBlock, valueBlockB, 'next');

  const variableBlockA = createBlock(ws, 'variable', { 'NAME': 'SOL_USDC' });
  const variableBlockB = createBlock(ws, 'variable', { 'NAME': 'WETHUSDT' });
  connectBlocks(valueBlock, variableBlockA, 'input', 'INPUT');
  connectBlocks(valueBlockB, variableBlockB, 'input', 'INPUT');

  const formulaBlock = createBlock(ws, 'simple_formula', { 'OPERATION': '÷' });
  connectBlocks(transformationBlockB, formulaBlock, 'input', 'VALUES');

  const numberBlockB = createBlock(ws, 'constant', { 'INPUT': 1 });
  const variableBlockC = createBlock(ws, 'variable', { 'NAME': 'SOL_USDC' });
  connectBlocks(formulaBlock, numberBlockB, 'input', 'VALUE_A');
  connectBlocks(formulaBlock, variableBlockC, 'input', 'VALUE_B');



  return ws;
}

if (ws) {
  initWorkspace(ws);
  runCode();

  // Every time the workspace changes state, save the changes to storage.
  ws.addChangeListener((e: Blockly.Events.Abstract) => {
    if (e.isUiEvent) return;
  });

  // Whenever the workspace changes meaningfully, run the code again.
  ws.addChangeListener((e: Blockly.Events.Abstract) => {
    
    if (
      e.isUiEvent ||
      e.type == Blockly.Events.FINISHED_LOADING ||
      ws.isDragging()
    ) {
      return;
    }
    runCode();
  });
}
