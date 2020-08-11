import * as THREE from 'three'

export default class Tree extends THREE.Mesh {
  static requiredLabels = ['grass']
  static labels = ['vegetation', 'tree']
  static baseDensity = 0.1

  constructor(webgl, options) {
    super(options)

    this.type = 'TreeMesh'

    this.webgl = webgl
    this.options = options

    const seedrandom = require('seedrandom'),
      rng = seedrandom(this.options.seed)

    this.height = this.options.height + (rng() - 0.5) * this.options.height * 0.5

    this.geometry = new THREE.CylinderGeometry(0.01, this.height * 0.25, this.height, 32, 4, false)
    this.geometry.translate(0, this.height * 0.5, 0)

    const rx = rng() * 0.1,
      ry = rng() * 0.1,
      rz = rng() * 0.1,
      color = new THREE.Color(0.1 + rx, 0.4 + ry, 0.2 + rz)
    this.material = new THREE.MeshStandardMaterial({ color: color })

    this.castShadow = true
    this.receiveShadow = true
  }
}
