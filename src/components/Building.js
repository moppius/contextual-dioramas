import * as THREE from 'three'
import ContextualObject from './ContextualObject'

export default class Building extends ContextualObject {
  static className = 'Building'
  static distributionOptions = { grass: 1 }
  static labels = ['building']
  static baseDensity = 0.001

  constructor(webgl, options) {
    super(webgl, options)

    this.type = 'Building'

    const geometry = new THREE.BoxGeometry(
      this.options.bounds.x * 0.25,
      this.options.bounds.y * 0.25,
      this.options.bounds.z * 0.25
    )
    geometry.translate(0, this.options.bounds.y * 0.25 * 0.5, 0)

    const color = new THREE.Color(0.5, 0.4, 0.3)
    this.addMesh(geometry, { color: color })
  }
}
