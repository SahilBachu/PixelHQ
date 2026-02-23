import Phaser from 'phaser'

import { createCharacterAnims } from '../anims/CharacterAnims'

import Item from '../items/Item'
import Chair from '../items/Chair'
import Computer from '../items/Computer'
import Whiteboard from '../items/Whiteboard'
import VendingMachine from '../items/VendingMachine'
import '../characters/MyPlayer'
import MyPlayer from '../characters/MyPlayer'
import PlayerSelector from '../characters/PlayerSelector'
import { PlayerBehavior } from '../types/PlayerBehavior'
import { NavKeys, Keyboard } from '../types/KeyboardState'

import store from '../stores'
import { finishPlacement, cancelPlacement, selectAgent, AVATAR_OPTIONS } from '../stores/AgentStore'
import type { Agent } from '../stores/AgentStore'

const AGENT_SPRITE_SCALE = 1

export default class Game extends Phaser.Scene {
  private cursors!: NavKeys
  private keyE!: Phaser.Input.Keyboard.Key
  private keyR!: Phaser.Input.Keyboard.Key
  private map!: Phaser.Tilemaps.Tilemap
  myPlayer!: MyPlayer
  private playerSelector!: Phaser.GameObjects.Zone
  computerMap = new Map<string, Computer>()
  private whiteboardMap = new Map<string, Whiteboard>()

  // Agent placement
  private placementPreview: Phaser.GameObjects.Container | null = null
  private placementSprite: Phaser.GameObjects.Sprite | null = null
  private placementCircle: Phaser.GameObjects.Graphics | null = null
  private isPlacementValid = false
  private escKey!: Phaser.Input.Keyboard.Key

  // Agent sprites on map
  private agentSprites = new Map<string, Phaser.GameObjects.Container>()
  private lastAgentCount = 0

  constructor() {
    super('game')
  }

  registerKeys() {
    this.cursors = {
      ...this.input.keyboard.createCursorKeys(),
      ...(this.input.keyboard.addKeys('W,S,A,D') as Keyboard),
    }

    this.keyE = this.input.keyboard.addKey('E')
    this.keyR = this.input.keyboard.addKey('R')
    this.escKey = this.input.keyboard.addKey('ESC')
    this.input.keyboard.disableGlobalCapture()
  }

  disableKeys() {
    this.input.keyboard.enabled = false
  }

  enableKeys() {
    this.input.keyboard.enabled = true
  }

  create() {
    createCharacterAnims(this.anims)

    this.map = this.make.tilemap({ key: 'tilemap' })
    const FloorAndGround = this.map.addTilesetImage('FloorAndGround', 'tiles_wall')

    const groundLayer = this.map.createLayer('Ground', FloorAndGround)
    groundLayer.setCollisionByProperty({ collides: true })

    this.myPlayer = this.add.myPlayer(705, 500, 'adam', 'local-player')
    this.playerSelector = new PlayerSelector(this, 0, 0, 16, 16)

    // import chair objects from Tiled map to Phaser
    const chairs = this.physics.add.staticGroup({ classType: Chair })
    const chairLayer = this.map.getObjectLayer('Chair')
    chairLayer.objects.forEach((chairObj) => {
      const item = this.addObjectFromTiled(chairs, chairObj, 'chairs', 'chair') as Chair
      item.itemDirection = chairObj.properties[0].value
    })

    // import computers objects from Tiled map to Phaser
    const computers = this.physics.add.staticGroup({ classType: Computer })
    const computerLayer = this.map.getObjectLayer('Computer')
    computerLayer.objects.forEach((obj, i) => {
      const item = this.addObjectFromTiled(computers, obj, 'computers', 'computer') as Computer
      item.setDepth(item.y + item.height * 0.27)
      const id = `${i}`
      item.id = id
      this.computerMap.set(id, item)
    })

    // import whiteboards objects from Tiled map to Phaser
    const whiteboards = this.physics.add.staticGroup({ classType: Whiteboard })
    const whiteboardLayer = this.map.getObjectLayer('Whiteboard')
    whiteboardLayer.objects.forEach((obj, i) => {
      const item = this.addObjectFromTiled(
        whiteboards,
        obj,
        'whiteboards',
        'whiteboard'
      ) as Whiteboard
      const id = `${i}`
      item.id = id
      this.whiteboardMap.set(id, item)
    })

    // import vending machine objects from Tiled map to Phaser
    const vendingMachines = this.physics.add.staticGroup({ classType: VendingMachine })
    const vendingMachineLayer = this.map.getObjectLayer('VendingMachine')
    vendingMachineLayer.objects.forEach((obj, i) => {
      this.addObjectFromTiled(vendingMachines, obj, 'vendingmachines', 'vendingmachine')
    })

    // import other objects from Tiled map to Phaser
    this.addGroupFromTiled('Wall', 'tiles_wall', 'FloorAndGround', false)
    this.addGroupFromTiled('Objects', 'office', 'Modern_Office_Black_Shadow', false)
    this.addGroupFromTiled('ObjectsOnCollide', 'office', 'Modern_Office_Black_Shadow', true)
    this.addGroupFromTiled('GenericObjects', 'generic', 'Generic', false)
    this.addGroupFromTiled('GenericObjectsOnCollide', 'generic', 'Generic', true)
    this.addGroupFromTiled('Basement', 'basement', 'Basement', true)

    this.cameras.main.zoom = 1.5
    this.cameras.main.startFollow(this.myPlayer, true)

    this.physics.add.collider([this.myPlayer, this.myPlayer.playerContainer], groundLayer)
    this.physics.add.collider([this.myPlayer, this.myPlayer.playerContainer], vendingMachines)

    this.physics.add.overlap(
      this.playerSelector,
      [chairs, computers, whiteboards, vendingMachines],
      this.handleItemSelectorOverlap,
      undefined,
      this
    )

    // Setup placement input handlers
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      this.handlePlacementMove(pointer)
    })
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.handlePlacementClick(pointer)
    })
  }

  private handleItemSelectorOverlap(playerSelector, selectionItem) {
    const currentItem = playerSelector.selectedItem as Item
    if (currentItem) {
      if (currentItem === selectionItem || currentItem.depth >= selectionItem.depth) {
        return
      }
      if (this.myPlayer.playerBehavior !== PlayerBehavior.SITTING) currentItem.clearDialogBox()
    }

    playerSelector.selectedItem = selectionItem
    selectionItem.onOverlapDialog()
  }

  private addObjectFromTiled(
    group: Phaser.Physics.Arcade.StaticGroup,
    object: Phaser.Types.Tilemaps.TiledObject,
    key: string,
    tilesetName: string
  ) {
    const actualX = object.x! + object.width! * 0.5
    const actualY = object.y! - object.height! * 0.5
    const obj = group
      .get(actualX, actualY, key, object.gid! - this.map.getTileset(tilesetName).firstgid)
      .setDepth(actualY)
    return obj
  }

  private addGroupFromTiled(
    objectLayerName: string,
    key: string,
    tilesetName: string,
    collidable: boolean
  ) {
    const group = this.physics.add.staticGroup()
    const objectLayer = this.map.getObjectLayer(objectLayerName)
    objectLayer.objects.forEach((object) => {
      const actualX = object.x! + object.width! * 0.5
      const actualY = object.y! - object.height! * 0.5
      group
        .get(actualX, actualY, key, object.gid! - this.map.getTileset(tilesetName).firstgid)
        .setDepth(actualY)
    })
    if (this.myPlayer && collidable)
      this.physics.add.collider([this.myPlayer, this.myPlayer.playerContainer], group)
  }

  /* ─── Placement Mode ─────────────────────────────────── */

  private handlePlacementMove(pointer: Phaser.Input.Pointer) {
    const state = store.getState().agent.placementMode
    if (!state.isActive || !state.agentData) return

    const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y)

    if (!this.placementPreview) {
      this.createPlacementPreview(state.agentData.avatar)
    }

    this.placementPreview!.setPosition(worldPoint.x, worldPoint.y)

    // Check validity
    this.isPlacementValid = this.checkPlacementValid(worldPoint.x, worldPoint.y)
    this.updatePlacementVisual(this.isPlacementValid)
  }

  private handlePlacementClick(pointer: Phaser.Input.Pointer) {
    const state = store.getState().agent.placementMode
    if (!state.isActive || !state.agentData) return

    if (!pointer.leftButtonDown()) return

    const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y)

    if (this.checkPlacementValid(worldPoint.x, worldPoint.y)) {
      store.dispatch(finishPlacement({ x: worldPoint.x, y: worldPoint.y }))
      this.destroyPlacementPreview()
    }
  }

  private createPlacementPreview(avatarKey: string) {
    this.placementPreview = this.add.container(0, 0).setDepth(10000)

    // Circle indicator
    this.placementCircle = this.add.graphics()
    this.placementPreview.add(this.placementCircle)

    // Sprite
    this.placementSprite = this.add.sprite(0, 0, avatarKey, 0)
    this.placementSprite.setScale(AGENT_SPRITE_SCALE)
    this.placementPreview.add(this.placementSprite)
  }

  private updatePlacementVisual(isValid: boolean) {
    if (!this.placementCircle || !this.placementSprite) return

    this.placementCircle.clear()

    if (isValid) {
      this.placementSprite.setAlpha(1)
      this.placementSprite.setTint(0xffffff)
      this.placementCircle.lineStyle(2, 0x4ade80, 0.5)
      this.placementCircle.strokeCircle(0, 0, 25)
      this.placementCircle.fillStyle(0x4ade80, 0.08)
      this.placementCircle.fillCircle(0, 0, 25)
    } else {
      this.placementSprite.setAlpha(0.6)
      this.placementSprite.setTint(0xff4444)
      this.placementCircle.lineStyle(2, 0xff4444, 0.5)
      this.placementCircle.strokeCircle(0, 0, 25)
      this.placementCircle.fillStyle(0xff4444, 0.08)
      this.placementCircle.fillCircle(0, 0, 25)
    }
  }

  private destroyPlacementPreview() {
    if (this.placementPreview) {
      this.placementPreview.destroy()
      this.placementPreview = null
      this.placementSprite = null
      this.placementCircle = null
    }
  }

  private checkPlacementValid(x: number, y: number): boolean {
    // Check map bounds
    const mapWidth = this.map.widthInPixels
    const mapHeight = this.map.heightInPixels
    const margin = 32
    if (x < margin || x > mapWidth - margin || y < margin || y > mapHeight - margin) {
      return false
    }

    // Check distance from existing agents
    const agents = store.getState().agent.agents
    for (const agent of agents) {
      const dist = Phaser.Math.Distance.Between(x, y, agent.position.x, agent.position.y)
      if (dist < 50) return false
    }

    // Check distance from player
    if (this.myPlayer) {
      const dist = Phaser.Math.Distance.Between(x, y, this.myPlayer.x, this.myPlayer.y)
      if (dist < 40) return false
    }

    return true
  }

  /* ─── Agent Sprites ──────────────────────────────────── */

  private syncAgentSprites() {
    const agents = store.getState().agent.agents
    const selectedId = store.getState().agent.selectedAgentId

    // Remove sprites for deleted agents
    for (const [id, container] of this.agentSprites) {
      if (!agents.find((a) => a.id === id)) {
        container.destroy()
        this.agentSprites.delete(id)
      }
    }

    // Add or update sprites
    for (const agent of agents) {
      if (!this.agentSprites.has(agent.id)) {
        this.createAgentSprite(agent)
      }

      const container = this.agentSprites.get(agent.id)
      if (container) {
        container.setPosition(agent.position.x, agent.position.y)

        // Selection highlight
        const highlight = container.getData('highlight') as Phaser.GameObjects.Graphics
        if (highlight) {
          highlight.clear()
          if (selectedId === agent.id) {
            highlight.lineStyle(2, 0x0d59f2, 0.8)
            highlight.strokeCircle(0, 0, 20)
            highlight.fillStyle(0x0d59f2, 0.1)
            highlight.fillCircle(0, 0, 20)
          }
        }
      }
    }
  }

  private createAgentSprite(agent: Agent) {
    const container = this.add.container(agent.position.x, agent.position.y).setDepth(agent.position.y)

    // Selection highlight circle (behind sprite)
    const highlight = this.add.graphics()
    container.add(highlight)
    container.setData('highlight', highlight)

    // Character sprite
    const sprite = this.add.sprite(0, 0, agent.avatar, 0)
    sprite.setScale(AGENT_SPRITE_SCALE)
    sprite.play(`${agent.avatar}_idle_down`, true)
    container.add(sprite)

    // Name label
    const avatarColor = AVATAR_OPTIONS.find((o) => o.key === agent.avatar)?.color ?? '#ffffff'
    const nameTag = this.add.text(0, -30, agent.name, {
      fontSize: '10px',
      fontFamily: 'Arial',
      color: avatarColor,
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5)
    container.add(nameTag)
    container.setData('nameTag', nameTag)

    // Make interactive
    const hitArea = new Phaser.Geom.Circle(0, 0, 20)
    container.setInteractive(hitArea, Phaser.Geom.Circle.Contains)

    container.on('pointerdown', () => {
      store.dispatch(selectAgent(agent.id))
    })

    container.on('pointerover', () => {
      sprite.setScale(AGENT_SPRITE_SCALE * 1.1)
    })

    container.on('pointerout', () => {
      sprite.setScale(AGENT_SPRITE_SCALE)
    })

    this.agentSprites.set(agent.id, container)
  }

  update(t: number, dt: number) {
    if (this.myPlayer) {
      this.playerSelector.update(this.myPlayer, this.cursors)
      this.myPlayer.update(this.playerSelector, this.cursors, this.keyE, this.keyR)
    }

    // Check ESC for placement cancel
    const placementState = store.getState().agent.placementMode
    if (placementState.isActive && this.escKey && Phaser.Input.Keyboard.JustDown(this.escKey)) {
      store.dispatch(cancelPlacement())
      this.destroyPlacementPreview()
    }

    // Cancel placement if state changed externally
    if (!placementState.isActive && this.placementPreview) {
      this.destroyPlacementPreview()
    }

    // Sync agent sprites
    this.syncAgentSprites()
  }
}
