import * as THREE from 'three'
import assets from '../lib/AssetManager'
import ContextualObject from './ContextualObject'

const cactusGltfKey = assets.queue({ url: 'models/cactus_01.glb' })

export default class Cactus extends ContextualObject {
  static className = 'Cactus'
  static distributionOptions = { ground: 1 }
  static labels = ['vegetation', 'cactus']
  static baseDensity = 0.015
  static randomAngle = new THREE.Vector3(4, 180, 4)
  static baseHeight = 5

  constructor(webgl, options) {
    super(webgl, options)

    this.type = 'Cactus'

    const cactusGltf = assets.get(cactusGltfKey)
    const cactus = cactusGltf.scene.clone()

    cactus.traverse((child) => {
      if (child.isMesh) {
        child.material = child.material.clone()
        child.material.color.r += (this.rng() - 0.5) * 0.1
        child.material.color.g += (this.rng() - 0.5) * 0.1
        child.material.color.b += (this.rng() - 0.5) * 0.1
        child.castShadow = true
        child.receiveShadow = true
      }
    })

    const scaleModifier = (this.rng() - 0.5) * this.constructor.sizeVariation
    this.scale.x += scaleModifier
    this.scale.y += scaleModifier
    this.scale.z += scaleModifier

    this.add(cactus)
  }
}
