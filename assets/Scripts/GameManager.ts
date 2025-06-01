import { _decorator, AudioClip, AudioSource, Component, EventTouch, Input, instantiate, Node, ParticleSystem2D, Prefab, Sprite, SpriteAtlas, SpriteFrame, sys, Tween, tween, UIOpacity, UITransform, v3, Vec3 } from 'cc';
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

    @property(Node)
    CTA: Node = null;

    @property(SpriteAtlas)
    ColorImgs: SpriteAtlas = null;

    @property(SpriteAtlas)
    BnWImgs: SpriteAtlas = null;

    @property(AudioClip)
    audioclips: AudioClip[] = [];

    private draggingNode: Node | null = null;
    private originalPositions: Map<Node, Vec3> = new Map();
    private offset: Vec3 = new Vec3();

    audiosource: AudioSource;
    idx: number = 0;

    ansCnt = 0;

    start() {
        this.audiosource = this.node.getComponent(AudioSource);

        const allNodes = this.totalNodes
        this.addTouch();
        this.handTween(this.totalNodes[12].position, this.totalNodes[13].position);

    }

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
                    .delay(0.2)
                    .call(() => {
                        this.Hand.children[0].active = true;
                        this.Hand.children[1].active = false;
                    })
                    .to(1, { position: initPnt }, { easing: 'sineInOut' })
                    
                     .call(() => {
                        this.Hand.children[0].active = false;
                        this.Hand.children[1].active = true;
                    }).delay(0.2)

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
        this.draggingNode.setScale(1, 1, 1)
        const touchPos = event.getUILocation();
        const worldZero = this.draggingNode.getComponent(UITransform).convertToWorldSpaceAR(Vec3.ZERO);

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

    onTouchEnd(event: EventTouch) {
        if (!this.draggingNode) return;

        let snapped = false;

        for (let target of this.totalNodes) {
            const dist = Vec3.distance(this.draggingNode.position, target.position);
            if (dist < 50 && this.draggingNode != target && this.draggingNode.name === target.name) {
                this.draggingNode.setPosition(target.position);
                if (!target.children?.length && this.SnappedNodes.indexOf(target.name) == -1) {
                    this.ParticleNode.setPosition(target.position)
                    this.ParticleNode.getComponent(ParticleSystem2D).enabled = true;
                    this.ParticleNode.getComponent(ParticleSystem2D).resetSystem()
                    tween(target)
                        .to(0.2, { scale: new Vec3(1.1, 1.1, 1.1) }, { easing: "quadIn" })
                        .to(0.2, { scale: new Vec3(1, 1, 1) }, { easing: "quadIn" })
                        .call(() => {
                            this.ParticleNode.getComponent(ParticleSystem2D).enabled = false;
                            if (target.name.split("_").length === 2) {
                                target.setScale(0.6, 0.6, 0.6)
                            }
                        })
                        .start();

                    let name = target.name.split("_");
                    if (name.length === 3) {
                        if (this.ansCnt <= 0)
                            this.handTween(this.totalNodes[18].position, this.totalNodes[26].position);
                        target.setScale(0.6, 0.6, 0.6)
                        target.name = name[0] + "_" + name[1];
                        target.getComponent(Sprite).spriteFrame = this.ColorImgs.getSpriteFrame(target.name);
                        this.SnappedNodes.push(target.name)
                    } else {
                        if (this.ansCnt <= 0)
                            this.handTween(this.totalNodes[13].position, this.totalNodes[18].position);

                        target.getComponent(Sprite).spriteFrame = this.BnWImgs.getSpriteFrame(target.name);
                        target.name += "_B"
                    }


                    this.scaleEffect();

                    this.draggingNode.active = false;
                    this.audiosource.playOneShot(this.audioclips[1], 6);
                    snapped = true;

                } else if (target.children?.length && this.SnappedNodes.indexOf(target.name) !== -1) {
                    target.children[0].active = true;
                    this.draggingNode.active = false;
                    this.audiosource.playOneShot(this.audioclips[2], 6);
                    this.scaleEffect();
                    this.ansCnt += 1;
                    snapped = true;
                }

                break;
            }
        }

        if (!snapped) {
            const original = this.originalPositions.get(this.draggingNode);
            if (original) {
                this.draggingNode.setPosition(original);
                this.audiosource.playOneShot(this.audioclips[0], 0.6);
            }
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

    OnStartButtonClick() {

        if (sys.os === sys.OS.ANDROID) {
            window.open("https://play.google.com/store/apps/details?id=com.game.goolny.stickers&hl=en-US&gl=US", "MergeSticker");
        } else if (sys.os === sys.OS.IOS) {
            window.open("https://apps.apple.com/us/app/merge-sticker-playbook-2d/id6505066374", "MergeSticker");
        } else {
            window.open("https://play.google.com/store/apps/details?id=com.game.goolny.stickers&hl=en-US&gl=US", "MergeSticker");
        }
        // this.super_html_playable.download();

    }

    timer = 0;


    protected update(dt: number): void {

        if (this.ansCnt >= 1) {
            this.timer += dt;

            if (this.timer >= 20 || this.ansCnt == 3) {
                this.CTA.active = true;
            }
        }


    }

}


