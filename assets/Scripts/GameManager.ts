import { _decorator, AudioClip, AudioSource, Component, EventTouch, Input, instantiate, Node, ParticleSystem2D, PolygonCollider2D, Prefab, random, randomRangeInt, RigidBody2D, Sprite, SpriteAtlas, SpriteFrame, sys, Tween, tween, UIOpacity, UITransform, v2, v3, Vec2, Vec3 } from 'cc';
import { super_html_playable } from './super_html_playable';
const { ccclass, property } = _decorator;

@ccclass('GameManager')
export class GameManager extends Component {


    @property([Node])
    totalNodes: Node[] = [];

    @property(SpriteFrame)
    Emojis: SpriteFrame[] = [];

    @property(SpriteFrame)
    Text: SpriteFrame[] = [];

    @property(Node)
    EmojiNode: Node = null;

    @property(Node)
    Hand: Node = null;

    @property(Node)
    Textnode: Node = null;

    @property(Node)
    dragArea: Node = null;

    @property(Node)
    DragText: Node = null;

    @property(Node)
    ParticleNode: Node = null;

    @property(AudioSource)
    BG: AudioSource = null;

    @property(Node)
    CTA: Node = null;

    @property(SpriteAtlas)
    ColorImgs: SpriteAtlas = null;

    @property(SpriteAtlas)
    BnWImgs: SpriteAtlas = null;

    @property(AudioClip)
    audioclips: AudioClip[] = [];

    super_html_playable: super_html_playable = new super_html_playable();

    private draggingNode: Node | null = null;
    private originalPositions: Map<Node, Vec3> = new Map();
    private offset: Vec3 = new Vec3();

    audiosource: AudioSource;
    idx: number = 0;

    ansCnt = 0;

    ClrNodeCtnSize: object = { "mcd_M": v2(269, 335), "mcd_FF": v2(212, 294), "mcd_CD": v2(512, 512) }
    ClrNodeCtnSizeB: object = { "mcd_M": v2(134, 150), "mcd_FF": v2(80, 106), "mcd_CD": v2(65, 129) }

    

     public Downnload(): void {
        this.super.download();
    }

    start() {
        this.audiosource = this.node.getComponent(AudioSource);

        const allNodes = this.totalNodes
        this.addTouch();
        this.scheduleOnce(() => {

            this.handTween(this.totalNodes[this.handpos[this.handId][0]].position, this.totalNodes[this.handpos[this.handId][1]].position);
        }, 1.8)


    }

    handId = 0;

    handpos: number[][] = [[12, 13], [13, 18], [18, 26]]

    handTween(initPnt, finlaPnt) {

        this.Hand.active = true;
        this.DragText.active = true;

        let nodeToAnimate = this.DragText;
        const zoomIn = tween(nodeToAnimate)
            .to(0.8, { scale: v3(1.1, 1.1, 1.1) });
        const zoomOut = tween(nodeToAnimate)
            .to(0.8, { scale: v3(0.9, 0.9, 0.9) });
        tween(nodeToAnimate)
            .sequence(zoomIn, zoomOut)
            .union()
            .repeatForever()
            .start();
        this.Hand.setPosition(initPnt);

        tween(this.Hand)
            .repeatForever(
                tween()
                    .call(() => {
                        this.Hand.children[0].active = true;
                        this.Hand.children[1].active = false;
                    })
                    .to(1, { position: finlaPnt }, { easing: 'sineInOut' })
                    .call(() => {
                        this.Hand.children[0].active = false;
                        this.Hand.children[1].active = true;
                    })
                    .delay(0.6)
                    .call(() => {
                        this.Hand.children[0].active = true;
                        this.Hand.children[1].active = false;
                    })
                    .to(1, { position: initPnt }, { easing: 'sineInOut' })

                    .call(() => {
                        this.Hand.children[0].active = false;
                        this.Hand.children[1].active = true;
                    }).delay(0.6)

            )
            .start();
    }

    addTouch() {
        const allNodes = this.totalNodes

        // Store original positions
        for (let i = 0; i < 24; i++) {
            let node = allNodes[i]
            this.originalPositions.set(node, node.position.clone());

            // Attach touch handlers
            node.on(Input.EventType.TOUCH_START, this.onTouchStart, this);
            node.on(Input.EventType.TOUCH_MOVE, this.onTouchMove, this);
            node.on(Input.EventType.TOUCH_END, this.onTouchEnd, this);
            node.on(Input.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
        }
    }

    onTouchStart(event: EventTouch) {
        this.draggingNode = event.target as Node;
        // this.draggingNode.setScale(1, 1, 1)
        // if (this.draggingNode.name == "mcd_M") {
        //     this.draggingNode.setScale(0.8, 0.8, 0.8)
        // }
        this.draggingNode.setRotationFromEuler(0, 0, 0)
        const touchPos = event.getUILocation();
        const worldZero = this.draggingNode.getComponent(UITransform).convertToWorldSpaceAR(Vec3.ZERO);
        this.draggingNode.getComponent(PolygonCollider2D).enabled = false;
        this.draggingNode.getComponent(RigidBody2D).enabled = false;

        this.offset.set(touchPos.x - worldZero.x, touchPos.y - worldZero.y, 0);
        this.draggingNode.setSiblingIndex(this.draggingNode.parent.children.length - 2)
        Tween.stopAllByTarget(this.Hand);
        this.Hand.active = false;
        this.DragText.active = false;
    }

    onTouchMove(event: EventTouch) {
        if (!this.draggingNode || !this.dragArea) return;

        const touchPos = event.getUILocation();
        const worldPos = new Vec3(touchPos.x - this.offset.x, touchPos.y - this.offset.y, 0);

        const localPos = this.dragArea.getComponent(UITransform).convertToNodeSpaceAR(worldPos);
        this.draggingNode.setPosition(localPos);
    }

    SnappedNodes: string[] = [];
    DupIdx = 0;

    onTouchEnd(event: EventTouch) {
        if (!this.draggingNode) return;

        let snapped = false;

        for (let target of this.totalNodes) {
            const dist = Vec3.distance(this.draggingNode.position, target.position);
            if (dist < 50 && this.draggingNode != target && this.draggingNode.name === target.name) {
                this.draggingNode.setPosition(target.position);
                if (!target.children?.length && this.SnappedNodes.indexOf(target.name) == -1) {
                    if (target.name == "mcd_BR") {
                        this.handId += 1;
                    }
                    this.ParticleNode.setPosition(target.position)
                    this.ParticleNode.getComponent(ParticleSystem2D).enabled = true;
                    this.ParticleNode.getComponent(ParticleSystem2D).resetSystem()
                    let name = target.name.split("_");
                    tween(target)
                        .to(0.2, { scale: new Vec3(1.1, 1.1, 1.1) }, { easing: "quadIn" })
                        .to(0.2, { scale: new Vec3(0.8, 0.8, 0.8) }, { easing: "quadIn" })
                        .call(() => {
                            this.ParticleNode.getComponent(ParticleSystem2D).enabled = false;
                            if (name.length === 2) {
                                target.setScale(1.3, 1.3, 1.3)

                            }
                        })
                        .start();


                    if (name.length === 3) {
                        if (this.ansCnt <= 0) {
                            this.handTween(this.totalNodes[this.handpos[this.handId][0]].position, this.totalNodes[this.handpos[this.handId][1]].position);
                        }

                        // target.setScale(0.8, 0.8, 0.8)

                        target.name = name[0] + "_" + name[1];

                        target.getComponent(Sprite).spriteFrame = this.ColorImgs.getSpriteFrame(target.name);
                        if (target.name == "mcd_M") {
                            target.getComponent(UITransform).setContentSize(134, 150)
                        }
                        if (target.name == "mcd_FF") {
                            target.getComponent(UITransform).setContentSize(80, 106)

                        }
                        if (target.name == "mcd_CD") {
                            target.getComponent(UITransform).setContentSize(65, 129)

                        }
                        this.SnappedNodes.push(target.name)
                        this.movetoSticker(target);

                    } else {
                        if (this.ansCnt <= 0) {
                            this.handTween(this.totalNodes[this.handpos[this.handId][0]].position, this.totalNodes[this.handpos[this.handId][1]].position);
                        }


                        target.getComponent(Sprite).spriteFrame = this.BnWImgs.getSpriteFrame(target.name);
                        target.setScale(1.3, 1.3, 1.3)
                        target.name += "_B"
                    }


                    this.scaleEffect();

                    this.draggingNode.active = false;
                    const original = this.originalPositions.get(this.draggingNode);

                    let dupNode = instantiate(this.totalNodes[this.DupIdx]);
                    if (original) {
                        dupNode.parent = this.draggingNode.parent;
                        dupNode.setPosition(original.x, 253);
                        // this.draggingNode.name = "dup" + random().toString();
                        dupNode.setSiblingIndex(0)
                        dupNode.name = this.totalNodes[this.DupIdx].name;
                        dupNode.on(Input.EventType.TOUCH_START, this.onTouchStart, this);
                        dupNode.on(Input.EventType.TOUCH_MOVE, this.onTouchMove, this);
                        dupNode.on(Input.EventType.TOUCH_END, this.onTouchEnd, this);
                        dupNode.on(Input.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
                        this.originalPositions.set(dupNode, dupNode.position.clone());
                        this.totalNodes.push(dupNode)
                    }
                    this.audiosource.playOneShot(this.audioclips[1], 0.6);
                    snapped = true;
                    this.DupIdx += 1;

                } else if (target.children?.length && this.SnappedNodes.indexOf(target.name) !== -1) {
                    target.children[0].active = true;
                    this.draggingNode.active = false;
                    this.audiosource.playOneShot(this.audioclips[2], 0.6);
                    this.scaleEffect();
                    this.ansCnt += 1;
                    snapped = true;

                    const original = this.originalPositions.get(this.draggingNode);

                    let dupNode = instantiate(this.totalNodes[this.DupIdx]);
                    if (original) {
                        dupNode.parent = this.draggingNode.parent;
                        dupNode.setPosition(original.x, 253);
                        // this.draggingNode.name = "dup" + random().toString();
                        dupNode.setSiblingIndex(0)
                        dupNode.name = this.totalNodes[this.DupIdx].name;
                        dupNode.on(Input.EventType.TOUCH_START, this.onTouchStart, this);
                        dupNode.on(Input.EventType.TOUCH_MOVE, this.onTouchMove, this);
                        dupNode.on(Input.EventType.TOUCH_END, this.onTouchEnd, this);
                        dupNode.on(Input.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
                        this.originalPositions.set(dupNode, dupNode.position.clone());
                        this.totalNodes.push(dupNode)
                        this.DupIdx += 1;
                    }
                }

                break;
            }
        }

        if (!snapped) {
            const original = this.originalPositions.get(this.draggingNode);
            if (original) {
                this.draggingNode.setPosition(original.x, 233);
                this.audiosource.playOneShot(this.audioclips[0], 0.6);
            }
            this.draggingNode.getComponent(PolygonCollider2D).enabled = true;
            this.draggingNode.getComponent(RigidBody2D).enabled = true;
        }

        this.draggingNode = null;
    }

    scaleEffect() {
        this.EmojiNode.getComponent(Sprite).spriteFrame = this.Emojis[this.idx];
        this.Textnode.getComponent(Sprite).spriteFrame = this.Text[this.idx];
        tween(this.EmojiNode)
            .to(0.3, { scale: new Vec3(0.3, 0.3, 0.3) }, { easing: "quadIn" })
            .to(0.1, { scale: new Vec3(0.2, 0.2, 0.2) }, { easing: "quadIn" })
            .delay(0.5)
            .call(() => {
                this.EmojiNode.getComponent(Sprite).spriteFrame = null;
                this.EmojiNode.setScale(0, 0, 0)
            })
            .start();
        tween(this.Textnode)
            .to(0.3, { scale: new Vec3(1.4, 1.4, 1.4) }, { easing: "quadIn" })
            .to(0.1, { scale: new Vec3(1.2, 1.2, 1.2) }, { easing: "quadIn" })
            .delay(0.5)
            .call(() => {
                this.Textnode.getComponent(Sprite).spriteFrame = null;
                this.Textnode.setScale(0, 0, 0)
            })
            .start();

        this.idx += 1;
        if (this.idx >= 3) {
            this.idx = 0;
        }
    }

    movetoSticker(node:Node){
        this.Hand.active = false;
        this.DragText.active = false;
        for(let i=24; i<32 ; i++){
            if(this.totalNodes[i].name == node.name){
                node.getComponent(PolygonCollider2D).enabled =false
                tween(node).to(0.4,{position:this.totalNodes[i].position}).call(()=>{
                    node.active =false;
                    this.audiosource.playOneShot(this.audioclips[2], 0.6);
                    this.scaleEffect();
                    this.ansCnt += 1;
                    this.totalNodes[i].children[0].active = true
                }).start();

                break;
            }
        }

    }

    OnStartButtonClick() {

        this.BG.enabled = false;
        this.node.getComponent(AudioSource).enabled = false;

        if (sys.os === sys.OS.ANDROID) {
            window.open("https://play.google.com/store/apps/details?id=com.game.goolny.stickers&hl=en-US&gl=US", "MergeSticker");
        } else if (sys.os === sys.OS.IOS) {
            window.open("https://apps.apple.com/us/app/merge-sticker-playbook-2d/id6505066374", "MergeSticker");
        } else {
            window.open("https://play.google.com/store/apps/details?id=com.game.goolny.stickers&hl=en-US&gl=US", "MergeSticker");
        }
        this.super_html_playable.download();

    }

    timer = 0;
    dt1 = 0


    protected update(dt: number): void {

        if (this.ansCnt >= 1) {
            this.timer += dt;

            if (this.timer >= 22 || this.ansCnt == 3) {
                this.dt1 += dt;
                if (this.dt1 >= 4) {
                    this.CTA.active = true;
                }

            }
        }


    }

}


