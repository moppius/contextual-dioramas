import * as THREE from 'three'
import ContextualObject from './ContextualObject'

export default class Tree extends ContextualObject {
  static className = 'Tree'
  static requiredLabels = ['grass']
  static labels = ['vegetation', 'tree']
  static baseDensity = 0.05
  static baseHeight = 4

  constructor(webgl, options) {
    super(webgl, options)

    this.type = 'Tree'

    this.height =
      this.constructor.baseHeight +
      (this.rng() - 0.5) * this.constructor.baseHeight * this.constructor.sizeVariation

    const geometry = new THREE.CylinderGeometry(0.01, this.height * 0.25, this.height, 32, 4, false)
    geometry.translate(0, this.height * 0.5, 0)

    const color = new THREE.Color(0.1, 0.4, 0.2)
    this.addMesh(geometry, { color: color })
  }
}
