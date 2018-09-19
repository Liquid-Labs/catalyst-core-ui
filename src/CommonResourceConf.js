import camelCase from 'lodash.camelcase'
import { schema } from 'normalizr'

const defineConst = (obj, name, value) =>
  Object.defineProperty(obj, name, {
    value: value,
    writable: false,
    enumerable: true,
    configurable: false
  })

export default class CommonResourceConf {
  static listToMap(resourceList) {
    return resourceList.reduce((acc, resourceConf) => {
        acc[resourceConf.resourceName] = resourceConf
        return acc
      }, {})
  }

  constructor(itemName, apiConfig) {
    // Common data items that all resources have.
    defineConst(this, 'resourceName', itemName + 's')
    defineConst(this, 'itemName', itemName)

    defineConst(this, 'resourceCamelName', camelCase(this.resourceName))
    defineConst(this, 'itemCamelName', camelCase(itemName))

    defineConst(this, 'resourceConstantName',
      this.resourceName.replace('-', '_').toUpperCase());
    defineConst(this, 'itemConstantName',
      itemName.replace('-', '_').toUpperCase());

    defineConst(this, 'itemSchema',
      new schema.Entity('items', {}, { idAttribute: 'pubId' }))
    defineConst(this, 'listSchema', new schema.Array(this.itemSchema))

    // Resources that can be created define the following
    if (apiConfig) {
      // always define a model; in the simple case, that's all that's needed
      defineConst(this, 'model', apiConfig.model)
      defineConst(this, 'sortOptions', apiConfig.sortOptions)
      defineConst(this, 'sortDefault', apiConfig.sortDefault)
      // Creating a new UI-item runs through:
      // - createExport
      // - createDependencies
      // - createItem
      // This generates a emtpy-ish item to be completed by the user. Then
      // before being sent the API, the UI-item is run through 'createExport'

      // takes the redux 'state' and returns properties that the
      // 'createItem' or 'prepareCreate' methods care about (if any).
      this.createExport = apiConfig.createExport
      this.createDependencies = apiConfig.createDependencies || []
      // If no explicit 'createItem' is defined, then we just make a new
      // version of the model. If you need to do more to create the item, e.g.
      // set some associated relation based on the current context, then
      // this is where you'd do it.
      this.createItem = apiConfig.createItem || (() => new this.model())
      // 'prepare create' is for when the API create call (PUT /resourceX) needs
      // data other than just the item itself. This is used to wrap the item
      // data with additional data.
      this.prepareCreate = apiConfig.prepareCreate
    }
  }
}
