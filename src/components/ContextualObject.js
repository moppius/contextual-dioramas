import * as THREE from 'three'
import { degToRad } from 'canvas-sketch-util/math'

export default class ContextualObject extends THREE.Group {
  static className = null
  static distributionOptions = {}
  static labels = []
  static baseDensity = 0
  static randomAngle = new THREE.Vector3(0, 0, 0)
  static sizeVariation = 0.5
  static allowUnderwater = false

  constructor(webgl, options) {
    super(options)

    this.type = 'ContextualObject'

    this.webgl = webgl
    this.options = options

    const seedrandom = require('seedrandom')
    this.rng = seedrandom(this.options.seed)

    if (this.constructor.hasOwnProperty('randomAngle') === true) {
      this.setRotationFromEuler(
        new THREE.Euler(
          (this.rng() - 0.5) * 2 * degToRad(this.constructor.randomAngle.x),
          (this.rng() - 0.5) * 2 * degToRad(this.constructor.randomAngle.y),
          (this.rng() - 0.5) * 2 * degToRad(this.constructor.randomAngle.z)
        )
      )
    }
  }

  addMesh(geometry, materialOptions, variation = 0.1) {
    materialOptions.color.r += (this.rng() - 0.5) * variation
    materialOptions.color.g += (this.rng() - 0.5) * variation
    materialOptions.color.b += (this.rng() - 0.5) * variation
    if (materialOptions.roughness === undefined) {
      materialOptions.roughness = 0.6
    }
    materialOptions.roughness += (this.rng() - 0.5) * variation

    const material = new THREE.MeshPhysicalMaterial(materialOptions)

    const mesh = new THREE.Mesh(geometry, material)
    mesh.castShadow = true
    mesh.receiveShadow = true

    this.add(mesh)
  }
}
