/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly/core';

// Export all the code generators for our custom blocks,
// but don't register them with Blockly yet.
// This file has no side effects!
export const forBlock = Object.create(null);

forBlock['main_config'] = function (
  block: Blockly.Block,
  generator: Blockly.CodeGenerator,
) {
  const sourceStatements = generator.statementToCode(block, 'SOURCES') || '';
  const transformationStatements = generator.statementToCode(block, 'TRANSFORMATIONS') || '';

  const cleanSourceStatements = sourceStatements.replace(/,\s*$/, '');
  const cleanTransformationStatements = transformationStatements.replace(/,\s*$/, '');

  return `{
  "sources": [
    ${cleanSourceStatements}
  ],
  "transformations": [
    ${cleanTransformationStatements}
  ]
}`;
};

// Add generator for source block
forBlock['source'] = function(
  block: Blockly.Block,
) {
  const id = block.getFieldValue('ID');
  const dataSource = block.getFieldValue('DATA_SOURCE');
  const updateFrequency = block.getFieldValue('UPDATE_FREQUENCY');
  
  // Get source-specific configuration
  let config = {};
  switch(dataSource) {
    case 'uniswapv2':
      config = {
        dataSource: dataSource,
        updateFrequency: updateFrequency,
        contractAddress: block.getFieldValue('CONTRACT'),
        httpProviderUrl: block.getFieldValue('PROVIDER_URL'),
        baseTokenIndex: Number(block.getFieldValue('BASE_INDEX')),
        baseTokenDecimals: Number(block.getFieldValue('BASE_DECIMALS')),
        quoteTokenIndex: Number(block.getFieldValue('QUOTE_INDEX')),
        quoteTokenDecimals: Number(block.getFieldValue('QUOTE_DECIMALS'))
      };
      break;
    case 'raydiumclmm':
      config = {
        dataSource: dataSource,
        updateFrequency: updateFrequency,
        contractAddress: block.getFieldValue('CONTRACT'),
        httpProviderUrl: block.getFieldValue('PROVIDER_URL'),
      };
      break;
    case 'random':
      config = {
        dataSource: dataSource,
        updateFrequency: updateFrequency,
        minValue: Number(block.getFieldValue('MIN_VALUE')),
        maxValue: Number(block.getFieldValue('MAX_VALUE'))
      };
      break;
  }

  return `{
    "id": "${id}",
    "config": ${JSON.stringify(config)}
  },`;
};

function parseValues(values: string): string {
  const valuesArray = values.split('\n')
    .filter(Boolean)
    .map(v => v.trim())
    .join(', ');

  if (valuesArray.charAt(0) === '(' && valuesArray.charAt(valuesArray.length - 1) === ')') {
    return valuesArray.slice(1, -1);
  }
  
  return valuesArray
}

// Add generator for transformation block
forBlock['transformation'] = function(
  block: Blockly.Block,
  generator: Blockly.CodeGenerator,
) {
  const id = block.getFieldValue('ID');
  const values = generator.statementToCode(block, 'VALUES');

  var parsedValues = parseValues(values)
  
  return `{
    "id": "${id}",
    "formula": "${parsedValues}"
  },`;
};

forBlock['aggregation'] = function(
  block: Blockly.Block,
  generator: Blockly.CodeGenerator,
) {
  const formula = block.getFieldValue('FORMULA');
  const values = generator.statementToCode(block, 'VALUES');

  var parsedValues = parseValues(values)

  return `${formula}(${parsedValues})`;
}

forBlock['value'] = function(
  block: Blockly.Block,
  generator: Blockly.CodeGenerator,
) {
  const input = block.getInputTargetBlock('INPUT');
  const inputVal = input ? generator.blockToCode(input) : 'none';
  return inputVal + '\n'
}

// Add generator for operation block
forBlock['simple_formula'] = function(
  block: Blockly.Block,
  generator: Blockly.CodeGenerator,
) {
  const valueABlock = block.getInputTargetBlock('VALUE_A');
  const aVal = valueABlock ? generator.blockToCode(valueABlock) : 'none';
  const operation = block.getFieldValue('OPERATION');
  const valueBBlock = block.getInputTargetBlock('VALUE_B');
  const bVal = valueBBlock ? generator.blockToCode(valueBBlock) : 'none';

  var mappedOperation = operation === '÷' ? '/' : operation;
  mappedOperation = mappedOperation === '×' ? '*' : mappedOperation;

  return `(${aVal} ${mappedOperation} ${bVal})`;
};

// Add generator for variable block
forBlock['variable'] = function(
  block: Blockly.Block,
) {
  const name = block.getFieldValue('NAME');
  return `${name}`;
};

forBlock['constant'] = function(
  block: Blockly.Block,
) {
  const num = block.getFieldValue('INPUT');
  return num;
}
