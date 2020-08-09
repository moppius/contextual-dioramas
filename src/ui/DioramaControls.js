import * as THREE from 'three'
import { Diorama } from '../components/Diorama'
import { isEmpty } from 'lodash'

/** Default ranges for option sliders */
const ranges = {
  options: {
    seed: { max: 10000 },
    buildings: { max: 1, step: 0.01 },
    vegetation: { max: 1, step: 0.01 },
  },
  bounds: {
    x: { min: 5, max: 60 },
    y: { min: 5, max: 30 },
    z: { min: 5, max: 60 },
  },
  water: {
    level: { max: 1, step: 0.01 },
    depth: { max: 10, step: 0.5 },
    width: { min: 0.5, max: 20, step: 0.5 },
    falloff: { min: 0.5, max: 20, step: 0.5 },
  },
  sand: {
    width: { max: 10, step: 0.5 },
    falloff: { max: 10, step: 0.5 },
  },
}

class InputControl {
  constructor(owner, options) {
    this.owner = owner
    this.options = options

    this.field = document.createElement('div')

    this.label = document.createElement('label')
    this.label.innerText = toDisplayString(options.name)
    this.field.appendChild(this.label)

    this.input = document.createElement('input')
    this.input.onchange = () => this.propertyChanged()
    this.field.appendChild(this.input)

    options.parent.appendChild(this.field)
  }

  propertyChanged() {
    this.owner.propertyChanged()
  }

  setVisibility(visible) {
    this.field.style.display = visible ? 'block' : 'none'
  }
}

class CheckBoxControl extends InputControl {
  constructor(owner, options) {
    super(owner, options)

    this.input.setAttribute('type', 'checkbox')
    this.input.checked = options.defaultValue == true
  }

  getValue() {
    return this.input.checked
  }
}

class SliderControl extends InputControl {
  constructor(owner, options) {
    super(owner, options)

    this.input.setAttribute('type', 'range')
    this.input.setAttribute('min', options.min)
    this.input.setAttribute('max', options.max)
    this.input.setAttribute('step', options.step)
    this.input.value = options.defaultValue
  }

  getValue() {
    return parseFloat(this.input.value)
  }
}

class ControlGroup {
  constructor(owner, options) {
    this.owner = owner
    this.options = options

    this.div = document.createElement('div')
    this.heading = document.createElement('h' + options.depth)
    this.heading.innerText = toDisplayString(options.name)
    this.div.appendChild(this.heading)

    this.controls = {}

    for (const [key, value] of Object.entries(options.optionsObject)) {
      let childOptions = { name: key, defaultValue: value, parent: this.div }
      switch (typeof value) {
        case 'boolean':
          this.controls[key] = new CheckBoxControl(this, childOptions)
          break
        case 'number':
          Object.assign(childOptions, { min: 0, max: 100, step: 1 })
          if (options.name in ranges && key in ranges[options.name]) {
            Object.assign(childOptions, ranges[options.name][key])
          }
          this.controls[key] = new SliderControl(this, childOptions)
          break
        case 'object':
          if (isEmpty(value) === false) {
            Object.assign(childOptions, { optionsObject: value, depth: options.depth + 1 })
            this.controls[key] = new ControlGroup(this, childOptions)
          }
          break
      }
    }

    options.parent.appendChild(this.div)
  }

  propertyChanged() {
    if ('enabled' in this.controls) {
      this.setVisibility(this.controls.enabled.getValue())
    }
    this.owner.propertyChanged()
  }

  getValue() {
    let optionValues = {}
    for (const [key, control] of Object.entries(this.controls)) {
      optionValues[key] = control.getValue()
    }
    return optionValues
  }

  setVisibility(visible) {
    for (const [key, control] of Object.entries(this.controls)) {
      if (key !== 'enabled') {
        this.controls[key].setVisibility(visible)
      }
    }
  }
}

export default class DioramaControls {
  constructor(webgl, options) {
    this.webgl = webgl
    this.options = options

    const controlsDiv = document.getElementById('controls')

    this.controls = new ControlGroup(this, {
      name: 'options',
      optionsObject: this.options,
      depth: 1,
      parent: controlsDiv,
    })
  }

  propertyChanged() {
    if (this.webgl.scene.diorama !== undefined) {
      this.webgl.scene.remove(this.webgl.scene.diorama)
      this.webgl.scene.diorama = undefined
    }

    const dioramaOptions = this.controls.getValue()
    sessionStorage.setItem('dioramaOptions', JSON.stringify(dioramaOptions))

    this.webgl.scene.diorama = new Diorama(this.webgl, { diorama: dioramaOptions })
    this.webgl.scene.add(this.webgl.scene.diorama)
  }
}

function toDisplayString(name) {
  return isEmpty(name) ? name : name[0].toUpperCase() + name.slice(1)
}
