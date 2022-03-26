// ytarc <https://github.com/msikma/ytarc>
// © MIT license

const vm = require('vm')
const cloneDeep = require('lodash.clonedeep')

// Provides 'window' by default to be more compatible with common <script> contents.
const DEFAULT_SANDBOX = {window: {}}

/**
 * Retrieves a tag, usually a <script> tag, by looking for its contents.
 */
const findTagByContent = ($, tagType, content) => {
  const tags = $(tagType)
    .get()
    .filter(tag => {
      const $tag = $(tag)
      const text = $tag.text()
      if (text.includes(content)) {
        return true
      }
    })
  return tags?.[0]
}

/**
 * Runs a script inside of a sandboxed VM to extract its data.
 */
const extractScriptResult = (scriptContent, scriptSandbox = null) => {
  const sandbox = scriptSandbox ? scriptSandbox : cloneDeep(DEFAULT_SANDBOX)
  let success, error, value = null
  try {
    const script = new vm.Script(scriptContent)
    const ctx = new vm.createContext(sandbox)
    value = script.runInContext(ctx)
    success = true
    error = null
  }
  catch (err) {
    success = false
    error = err
  }
  return {
    success,
    error,
    value,
    sandbox
  }
}

module.exports = {
  findTagByContent,
  extractScriptResult
}
