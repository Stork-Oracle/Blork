/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/*
This toolbox contains nearly every single built-in block that Blockly offers.
You probably don't need every single block, and should consider either rewriting
your toolbox from scratch, or carefully choosing whether you need each block
listed here.
*/

export const toolbox = {
  kind: 'flyoutToolbox',
  contents: [
    {
      kind: 'block',
      type: 'source',
    },
    {
      kind: 'block',
      type: 'transformation',
    },
    {
      kind: 'block',
      type: 'aggregation',
    },
    {
      kind: 'block',
      type: 'value',
    },
    {
      kind: 'block',
      type: 'simple_formula',
    },
    {
      kind: 'block',
      type: 'variable',
    },
    {
      kind: 'block',
      type: 'constant',
    },
  ],
};
