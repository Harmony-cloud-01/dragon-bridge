import vm from 'node:vm'
import { stripTypeScriptTypes } from 'node:module'
import { readFile } from 'node:fs/promises'

export async function load(path, mocks = {}, globals = {}) {
  const context = vm.createContext({ console, ...globals })
  const modules = new Map()
  async function get(name) {
    if (modules.has(name)) return modules.get(name)
    if (name in mocks) {
      const values = mocks[name]
      const mod = new vm.SyntheticModule(Object.keys(values), function () {
        for (const [key, value] of Object.entries(values)) this.setExport(key, value)
      }, { context })
      modules.set(name, mod)
      return mod
    }
    throw Error(`Unexpected import ${name}`)
  }
  const source = stripTypeScriptTypes(await readFile(new URL(`../${path}`, import.meta.url), 'utf8'))
  const mod = new vm.SourceTextModule(source, { context, importModuleDynamically: async name => {
    const dep = await get(name)
    if (dep.status === 'unlinked') await dep.link(get)
    if (dep.status === 'linked') await dep.evaluate()
    return dep
  } })
  await mod.link(get)
  await mod.evaluate()
  return mod.namespace
}
