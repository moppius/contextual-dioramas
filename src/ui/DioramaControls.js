import * as THREE from 'three'
import Diorama from '../components/Diorama'

export default class DioramaControls {
  constructor(webgl, options) {
    this.webgl = webgl
    this.options = options

    this.controlsDiv = document.getElementById('controls')

    this.seedInput = this.createSlider('Seed', 0, 10000, this.options.seed)
    this.xInput = this.createSlider('X', 5, 100, this.options.bounds.x)
    this.yInput = this.createSlider('Y', 5, 50, this.options.bounds.y)
    this.zInput = this.createSlider('Z', 5, 100, this.options.bounds.z)
    this.buildingsInput = this.createSlider('Buildings', 0, 100, this.options.buildings * 100)
    this.vegetationInput = this.createSlider('Vegetation', 0, 100, this.options.vegetation * 100)
    this.waterInput = this.createCheckBox('Water', this.options.water)
    this.waterDepthInput = this.createSlider('Water Depth', 0, 10, this.options.waterDepth)
    this.waterWidthInput = this.createSlider('Water Width', 0, 20, this.options.waterWidth)
    this.waterFalloffInput = this.createSlider('Water Falloff', 0, 20, this.options.waterFalloff)
  }

  createCheckBox(labelText, defaultValue) {
    let field = document.createElement('div')

    let label = document.createElement('label')
    label.innerText = labelText + ':'
    field.appendChild(label)

    let element = document.createElement('input')
    element.setAttribute('type', 'checkbox')
    element.setAttribute('checked', defaultValue)
    element.onchange = () => this.propertyChanged()
    field.appendChild(element)

    this.controlsDiv.appendChild(field)

    return element
  }

  createSlider(labelText, minValue, maxValue, defaultValue) {
    let field = document.createElement('div')

    let label = document.createElement('label')
    label.innerText = labelText + ':'
    field.appendChild(label)

    let element = document.createElement('input')
    element.setAttribute('type', 'range')
    element.setAttribute('min', minValue)
    element.setAttribute('max', maxValue)
    element.value = defaultValue
    element.onchange = () => this.propertyChanged()
    field.appendChild(element)

    this.controlsDiv.appendChild(field)

    return element
  }

  propertyChanged() {
    const waterInputs = [this.waterDepthInput, this.waterWidthInput, this.waterFalloffInput]
    waterInputs.forEach((input) => {
      input.parentElement.style.display = this.waterInput.checked === true ? 'block' : 'none'
    })

    if (this.webgl.scene.diorama !== undefined) {
      this.webgl.scene.remove(this.webgl.scene.diorama)
      this.webgl.scene.diorama = undefined
    }

    this.webgl.scene.diorama = new Diorama(this.webgl, {
      seed: parseInt(this.seedInput.value),
      bounds: new THREE.Vector3(
        parseInt(this.xInput.value),
        parseInt(this.yInput.value),
        parseInt(this.zInput.value)
      ),
      buildings: this.buildingsInput.value * 0.01,
      vegetation: this.vegetationInput.value * 0.01,
      water: this.waterInput.checked,
      waterDepth: parseInt(this.waterDepthInput.value),
      waterWidth: parseInt(this.waterWidthInput.value),
      waterFalloff: parseInt(this.waterFalloffInput.value),
    })
    this.webgl.scene.add(this.webgl.scene.diorama)
  }
}
