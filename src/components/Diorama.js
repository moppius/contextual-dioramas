import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js'
import * as THREE from 'three'
import Building from './Building'
import ContextualObject from './ContextualObject'
import Quad from './ContextQuadtree'
import Rock from './Rock'
import Terrain from './Terrain'
import Tree from './Tree'
import Water from './Water'

const ALL_ASSET_CLASSES = [Building, Tree, Rock]

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

    const halfX = this.options.diorama.bounds.x / 2,
      halfZ = this.options.diorama.bounds.z / 2
    const maxSize = Math.max(halfX, halfZ)
    const quadBounds = new THREE.Box2(
      new THREE.Vector2(-maxSize, -maxSize),
      new THREE.Vector2(maxSize, maxSize)
    )
    this.options.diorama.contextQuadtree = new Quad(webgl, quadBounds)

    this.setupLights()

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

    for (const ASSET_CLASS of ALL_ASSET_CLASSES) {
      this.distributeObjects(ASSET_CLASS)
    }

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
    this.skylight = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.8)
    this.skylight.color.setHSL(0.56, 0.7, 0.6)
    this.skylight.groundColor.setHSL(0.095, 0.5, 0.5)
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
    this.sun.position.set(-0.5, 1, 0.375)
    this.sun.position.multiplyScalar(size)
    this.sun.castShadow = true
    this.sun.shadow.mapSize.width = 1024
    this.sun.shadow.mapSize.height = 1024
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

    const pmremGenerator = new THREE.PMREMGenerator(this.webgl.renderer)
    pmremGenerator.compileEquirectangularShader()

    const scene = this.webgl.scene

    new RGBELoader()
      .setDataType(THREE.UnsignedByteType)
      .setPath('textures/equirectangular/')
      .load('cloud_layers_1k.hdr', function (texture) {
        const envMap = pmremGenerator.fromEquirectangular(texture).texture

        scene.environment = envMap

        texture.dispose()
        pmremGenerator.dispose()
      })

    this.webgl.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.webgl.renderer.toneMappingExposure = 0.25
    this.webgl.renderer.outputEncoding = THREE.sRGBEncoding
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
    const material = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(0.2, 0.2, 0.2),
      envMap: this.webgl.scene.environment,
      roughness: 0.25,
    })
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

  /**
   * Distributes objects based on their contextual requirements.
   * @param {ContextualObject} classToDistribute The class of Contextual Object to distribute
   * @param {THREE.Mesh} onMesh Mesh to distribute objects on - if not specified, the terrain mesh is used
   */
  distributeObjects(classToDistribute, onMesh = undefined) {
    if (onMesh === undefined) {
      onMesh = this.terrain.mesh
    }

    const bounds = new THREE.Box3().setFromObject(onMesh),
      className = classToDistribute.prototype.constructor.className

    let numObjects = (bounds.max.x - bounds.min.x) * (bounds.max.z - bounds.min.z)

    if (className in this.options.diorama.assetClasses) {
      numObjects *= this.options.diorama.assetClasses[className]
    }

    if (hasOwnProperty.call(classToDistribute, 'baseDensity')) {
      numObjects *= classToDistribute.baseDensity
    } else {
      console.warn(`Class '${className}' had no baseDensity property!`)
    }

    numObjects = Math.floor(numObjects)

    const seedrandom = require('seedrandom'),
      rng = seedrandom(className + this.options.diorama.seed),
      raycaster = new THREE.Raycaster()

    const options = { bounds: this.options.diorama.bounds }
    for (let i = 0; i < numObjects; i++) {
      let position = new THREE.Vector3(rng(), 0, rng())
      position.multiply(new THREE.Vector3().subVectors(bounds.max, bounds.min))
      position.add(new THREE.Vector3(-0.5, 1, -0.5).multiply(this.options.diorama.bounds))
      raycaster.set(position, new THREE.Vector3(0, -1, 0))

      const labels = this.options.diorama.contextQuadtree.getLabels(position)
      if (this.meetsDistributionRequirements(classToDistribute, rng, labels) === false) {
        // This location doesn't meet our object's requirements
        continue
      }

      let intersects = raycaster.intersectObjects(this.children, true)
      let rayColor = 0xff0000
      if (intersects.length > 0) {
        rayColor = 0x0000ff

        options.isUnderwater = false
        if (classToDistribute.allowUnderwater === true && this.water !== null) {
          if (intersects[0].object === this.water.mesh) {
            // TODO: Maybe need a bounds against water level check for if the object is *entirely* underwater?
            options.isUnderwater = true
            intersects[0] = intersects[1] // Skip the water hit
          }
        }

        if (intersects[0].object === onMesh) {
          rayColor = 0x00ff00
          position = intersects[0].point

          options.seed = this.options.diorama.seed + i
          options.labels = this.options.diorama.contextQuadtree.getLabels(position)
          options.terrainColor = this.options.diorama.contextQuadtree.getAverageColor(position)
          const newObject = new classToDistribute(this.webgl, options)
          newObject.position.set(position.x, position.y, position.z)
          newObject.updateMatrixWorld()
          this.add(newObject)

          if (hasOwnProperty.call(classToDistribute, 'labels')) {
            if (classToDistribute.labels.length > 0) {
              this.options.diorama.contextQuadtree.addLabels(classToDistribute.labels, position)
            } else {
              console.warn(`No labels defined for class ${newObject.type}`)
            }
          } else {
            console.warn(`Failed to find labels property on class ${newObject.type}`)
          }
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

  /**
   * Returns true if a label array meets requirements set by the ContextualObject class, otherwise false
   * @param {ContextualObject} objectClass The class of Contextual Object to check
   * @param {seedrandom.prng} rng Seeded random number generator object
   * @param {string[]} labels Array of labels representing the context to check against
   * @returns Value representing if the requirements were met
   */
  meetsDistributionRequirements(object, rng, labels) {
    for (const [key, value] of Object.entries(object.distributionOptions)) {
      if (Object.keys(labels).includes(key) === true) {
        if (rng() <= value) {
          return true
        }
      }
    }
    return false
  }
}

export function getDefaultDioramaOptions() {
  const defaultDioramaOptions = {
    seed: 2655,
    bounds: new THREE.Vector3(48, 16, 32),
    biome: 'temperate',
    assetClasses: getAssetClassDefaults(),
    water: {
      enabled: true,
      level: 0.25,
      depth: 1,
      width: 2,
      falloff: 6,
      sand: {
        enabled: true,
        width: 1,
        falloff: 2,
      },
    },
  }

  function getAssetClassDefaults() {
    const result = {}
    for (const assetClass of ALL_ASSET_CLASSES) {
      result[assetClass.prototype.constructor.className] = 1
    }
    return result
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
