import * as THREE from 'three'
import assets from '../utils/AssetManager'
import ContextualObject from './ContextualObject'

const houseGltfKey = assets.queue({
  url: 'models/house_swedish_01.glb',
  type: 'gltf',
})

export default class Building extends ContextualObject {
  static className = 'Building'
  static distributionOptions = { ground: 1 }
  static labels = ['building']
  static baseDensity = 0.001
  static randomAngle = new THREE.Vector3(0, 180, 0)

  constructor(webgl, options) {
    super(webgl, options)

    this.type = 'Building'

    const houseGltf = assets.get(houseGltfKey)
    const house = houseGltf.scene.clone()

    house.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true
        child.receiveShadow = true
      }
    })

    this.add(house)
  }
}
