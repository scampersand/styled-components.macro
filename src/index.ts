/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable import/no-default-export */
/* eslint-disable */
// @ts-ignore
import {addDefault, addNamed} from '@babel/helper-module-imports'
import traverse from '@babel/traverse'
import {createMacro} from 'babel-plugin-macros'
// @ts-ignore
import babelPlugin from 'babel-plugin-styled-components'

/**
 * Modification of
 * https://github.com/styled-components/styled-components/blob/master/packages/styled-components/src/macro/index.js
 * to (1) allow changing the importModuleName, (2) build against a version of
 * babel-plugin-styled-components that supports configurable
 * topLevelImportPaths.
 */
export default createMacro(
  ({
    references,
    state,
    babel: {types: t},
    config: {importModuleName = 'styled-components', ...config} = {},
  }) => {
    const program = state.file.path

    // FIRST STEP: replace `styled-components/macro` by importModuleName
    let customImportName = undefined
    Object.keys(references).forEach(refName => {
      // generate new identifier
      let id
      if (refName === 'default') {
        id = addDefault(program, importModuleName, {nameHint: 'styled'})
        customImportName = id
      } else {
        id = addNamed(program, refName, importModuleName, {nameHint: refName})
      }

      // update references with the new identifiers
      for (const referencePath of references[refName]) {
        // @ts-ignore
        referencePath.node.name = id.name
      }
    })

    // SECOND STEP: apply babel-plugin-styled-components to the file
    const stateWithOpts = {
      ...state,
      opts: {
        ...config,
        topLevelImportPaths: (config.topLevelImportPaths || []).concat(
          importModuleName,
        ),
      },
      customImportName,
    }
    traverse(
      program.parent,
      babelPlugin({types: t}).visitor,
      undefined,
      stateWithOpts,
    )
  },
  {
    configName: 'styledComponents',
  },
)
