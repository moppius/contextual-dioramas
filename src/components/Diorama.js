import * as THREE from 'three'
import Building from './Building'
import Terrain from './Terrain'
import Tree from './Tree'
import Water from './Water'

export class Diorama extends THREE.Group {
  constructor(webgl, options) {
    const start = Date.now()
    super(options)

    this.webgl = webgl
    this.options = options

    this.type = 'Diorama'

    if (this.options.diorama.seed === undefined || this.options.diorama.seed === null) {
      this.options.diorama.seed = 0
    }

    console.log(
      `Creating new diorama (seed=${options.diorama.seed}, bounds=[${options.diorama.bounds.x}, ${options.diorama.bounds.y}, ${options.diorama.bounds.z}])`
    )

    let seedrandom = require('seedrandom')
    this.rng = seedrandom(this.options.diorama.seed)

    this.terrain = new Terrain(this.webgl, this.options.diorama)
    this.add(this.terrain)

    this.water = null
    if (this.options.diorama.water.enabled === true) {
      this.water = new Water(this.webgl, this.options.diorama, this.terrain.waterCurve)
      this.add(this.water)

      if (window.DEBUG) {
        const points = this.terrain.waterCurve.getPoints(10)
        const waterLineGeometry = new THREE.BufferGeometry().setFromPoints(points)
        const material = new THREE.LineBasicMaterial({ color: 0xff00ff })
        const waterLine = new THREE.Line(waterLineGeometry, material)
        this.add(waterLine)
      }
    }

    const buildingOptions = {
      bounds: this.options.diorama.bounds,
      density: 0.01 * this.options.diorama.buildings,
    }
    this.distributeObjects(Building, buildingOptions, this.terrain)

    const treeOptions = {
      density: 0.1 * this.options.diorama.vegetation,
      height: 3,
    }
    this.distributeObjects(Tree, treeOptions, this.terrain)

    this.setupLights()

    this.createBase()

    if (window.DEBUG) {
      let geometry = new THREE.BoxGeometry(
        this.options.diorama.bounds.x,
        this.options.diorama.bounds.y,
        this.options.diorama.bounds.z
      )
      let wireframe = new THREE.WireframeGeometry(geometry)

      this.wireframe = new THREE.LineSegments(wireframe)
      this.wireframe.material.depthTest = true
      this.wireframe.material.opacity = 0.2
      this.wireframe.material.transparent = true
      this.add(this.wireframe)
    }

    const elapsed = Date.now() - start
    console.log(`Generated in ${elapsed / 1000}s`)
  }

  update(dt, time) {}

  setupLights() {
    this.skylight = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.6)
    this.skylight.color.setHSL(0.6, 1, 0.6)
    this.skylight.groundColor.setHSL(0.095, 1, 0.75)
    this.skylight.position.set(0, 50, 0)
    this.add(this.skylight)

    const size =
      Math.max(
        this.options.diorama.bounds.x,
        this.options.diorama.bounds.y,
        this.options.diorama.bounds.z
      ) / 2

    this.sun = new THREE.DirectionalLight(0xffffff, 1)
    this.sun.color.setHSL(0.1, 1, 0.95)
    this.sun.position.set(0.7, 1, 0.6)
    this.sun.position.multiplyScalar(size)
    this.sun.castShadow = true
    this.sun.shadow.mapSize.width = 2048
    this.sun.shadow.mapSize.height = 2048
    this.sun.shadow.camera.left = -size * 1.5
    this.sun.shadow.camera.right = size * 1.5
    this.sun.shadow.camera.top = size * 1.5
    this.sun.shadow.camera.bottom = -size * 1.5
    this.sun.shadow.camera.near = 0.1
    this.sun.shadow.camera.far = size * 3
    this.add(this.sun)

    if (window.DEBUG) {
      const helper = new THREE.CameraHelper(this.sun.shadow.camera)
      this.add(helper)
    }
  }

  createBase() {
    // Base
    const basePadding = 4
    const baseHeight = 2
    const geometry = new THREE.BoxGeometry(
      this.options.diorama.bounds.x + basePadding,
      baseHeight,
      this.options.diorama.bounds.z + basePadding
    )
    const material = new THREE.MeshStandardMaterial({ color: new THREE.Color(0.4, 0.4, 0.4) })
    const base = new THREE.Mesh(geometry, material)
    base.translateY(-this.options.diorama.bounds.y / 2 - baseHeight / 2)
    base.castShadow = true
    base.receiveShadow = true
    this.add(base)

    // Floor plane
    const floorSize = Math.max(this.options.diorama.bounds.x, this.options.diorama.bounds.z) * 2
    const floorGeometry = new THREE.PlaneGeometry(floorSize, floorSize)
    floorGeometry.rotateX(-Math.PI / 2)
    floorGeometry.translate(0, -this.options.diorama.bounds.y / 2 - baseHeight, 0)
    const floorMaterial = new THREE.ShadowMaterial({ opacity: 0.25 })
    const floor = new THREE.Mesh(floorGeometry, floorMaterial)
    floor.receiveShadow = true
    this.add(floor)
  }

  distributeObjects(classToDistribute, options, onObject) {
    let bounds = new THREE.Box3().setFromObject(onObject)

    const area = (bounds.max.x - bounds.min.x) * (bounds.max.z - bounds.min.z)
    const numObjects = area * options.density

    const seedrandom = require('seedrandom'),
      rng = seedrandom(this.options.diorama.seed),
      raycaster = new THREE.Raycaster()

    for (let i = 0; i < numObjects; i++) {
      options.seed = this.options.diorama.seed + i
      let position = new THREE.Vector3(rng(), 0, rng())
      position.multiply(new THREE.Vector3().subVectors(bounds.max, bounds.min))
      position.add(new THREE.Vector3(-0.5, 1, -0.5).multiply(this.options.diorama.bounds))
      raycaster.set(position, new THREE.Vector3(0, -1, 0))

      let intersects = raycaster.intersectObjects(this.children, true)
      let rayColor = 0xff0000
      if (intersects.length > 0) {
        rayColor = 0x0000ff
        if (intersects[0].object === this.terrain.mesh) {
          rayColor = 0x00ff00
          position = intersects[0].point

          const newObject = new classToDistribute(this.webgl, options)
          newObject.position.set(position.x, position.y, position.z)
          newObject.updateMatrixWorld()
          this.add(newObject)
        }
      }

      if (window.DEBUG) {
        const arrow = new THREE.ArrowHelper(
          raycaster.ray.direction,
          raycaster.ray.origin,
          this.options.diorama.bounds.y * 1.5,
          rayColor,
          1,
          0.5
        )
        this.add(arrow)
      }
    }
  }
}

export function getDefaultDioramaOptions() {
  const defaultDioramaOptions = {
    seed: 5000,
    bounds: new THREE.Vector3(48, 16, 32),
    biome: 'temperate',
    buildings: 0.1,
    vegetation: 0.4,
    water: { enabled: true, depth: 1, width: 2, falloff: 6 },
  }

  // Load previous session settings if available
  const sessionOptions = sessionStorage.getItem('dioramaOptions')
  if (sessionOptions !== null) {
    let parsedOptions = {}
    try {
      parsedOptions = JSON.parse(sessionOptions)
    } catch (err) {
      console.log('Error when parsing session options!')
    }
    Object.assign(defaultDioramaOptions, parsedOptions)
  }

  return defaultDioramaOptions
}
