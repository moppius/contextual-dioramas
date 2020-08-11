import * as THREE from 'three'

export default class Building extends THREE.Group {
  static requiredLabels = ['grass']
  static labels = ['building']
  static baseDensity = 0.01

  constructor(webgl, options) {
    super(options)

    this.type = 'Building'

    this.webgl = webgl
    this.options = options

    const seedrandom = require('seedrandom'),
      rng = seedrandom(this.options.seed)

    const geometry = new THREE.BoxGeometry(
      this.options.bounds.x * 0.25,
      this.options.bounds.y * 0.25,
      this.options.bounds.z * 0.25
    )
    geometry.translate(0, this.options.bounds.y * 0.25 * 0.5, 0)

    const rx = rng() * 0.1,
      ry = rng() * 0.1,
      rz = rng() * 0.1,
      color = new THREE.Color(0.5 + rx, 0.4 + ry, 0.3 + rz)
    const material = new THREE.MeshStandardMaterial({ color: color })

    this.box = new THREE.Mesh(geometry, material)
    this.box.name = 'Building'
    this.box.castShadow = true
    this.box.receiveShadow = true

    this.add(this.box)
  }
}
