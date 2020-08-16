import * as THREE from 'three'
import ContextualObject from './ContextualObject'

export default class Tree extends ContextualObject {
  static className = 'Tree'
  static distributionOptions = { grass: 1 }
  static labels = ['vegetation', 'tree']
  static baseDensity = 0.05
  static randomAngle = new THREE.Vector3(4, 0, 4)
  static baseHeight = 4

  constructor(webgl, options) {
    super(webgl, options)

    this.type = 'Tree'

    this.height =
      this.constructor.baseHeight +
      (this.rng() - 0.5) * this.constructor.baseHeight * this.constructor.sizeVariation

    // Foliage
    const trunkVerticalOffset = 0.1 + this.rng() * 0.1
    let geometry = new THREE.CylinderGeometry(0.01, this.height * 0.25, this.height, 32, 4, false)
    geometry.translate(0, this.height * (0.5 + trunkVerticalOffset), 0)

    let color = new THREE.Color(0.15, 0.24, 0.12)
    this.addMesh(geometry, { color: color }, 0.05)

    // Trunk
    const trunkWidth = this.height * 0.05
    geometry = new THREE.CylinderGeometry(trunkWidth, trunkWidth, this.height / 4, 32, 1, true)
    geometry.translate(0, (this.height * trunkVerticalOffset) / 2, 0)

    color = new THREE.Color(0.28, 0.21, 0.12)
    this.addMesh(geometry, { color: color })
  }
}
