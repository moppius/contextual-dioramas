import * as THREE from 'three'
import ContextualObject from './ContextualObject'

export default class Rock extends ContextualObject {
  static className = 'Rock'
  static distributionOptions = { sand: 1, grass: 0.2 }
  static labels = ['rock']
  static baseDensity = 0.1
  static baseSize = 0.8
  static allowUnderwater = true

  constructor(webgl, options) {
    super(webgl, options)

    this.type = 'Rock'

    this.size =
      this.constructor.baseSize +
      (this.rng() - 0.5) * this.constructor.baseSize * this.constructor.sizeVariation

    const geometry = new THREE.SphereGeometry(this.size, 4, 4)
    const color = new THREE.Color(0.4, 0.36, 0.32)
    if (this.options.terrainColor !== null) {
      color.lerp(this.options.terrainColor, 0.5)
    }
    const roughness = this.options.isUnderwater === true ? 0.4 : 0.6
    this.addMesh(geometry, { color: color, roughness: roughness }, 0.05)
  }
}
