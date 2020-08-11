import * as THREE from 'three'

export default class Rock extends THREE.Mesh {
  static requiredLabels = ['sand']
  static labels = ['rock']
  static baseDensity = 0.1

  constructor(webgl, options) {
    super(options)

    this.type = 'RockMesh'

    this.webgl = webgl
    this.options = options

    const seedrandom = require('seedrandom'),
      rng = seedrandom(this.options.seed)

    this.size = this.options.size + (rng() - 0.5) * this.options.size * 0.5

    this.geometry = new THREE.SphereGeometry(this.size, 4, 4)

    const rx = rng() * 0.05,
      ry = rng() * 0.05,
      rz = rng() * 0.05,
      color = new THREE.Color(0.5 + rx, 0.4 + ry, 0.25 + rz)
    this.material = new THREE.MeshStandardMaterial({ color: color })

    this.castShadow = true
    this.receiveShadow = true
  }
}
