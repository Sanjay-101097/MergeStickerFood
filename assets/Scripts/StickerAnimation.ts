import { _decorator, Component, Node, Sprite, SpriteFrame, Tween, tween } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('StickerAnimation')
export class StickerAnimation extends Component {
    @property([SpriteFrame])
    frames: SpriteFrame[] = [];

    @property
    frameDuration: number = 0.1; // Seconds per frame

    private sprite!: Sprite;
    private currentIndex: number = 0;
    private playing: boolean = false;

    onLoad() {
        this.sprite = this.getComponent(Sprite)!;
        this.playAnimation();
    }

    playAnimation(loop: boolean = false) {
        if (this.frames.length === 0 || this.playing) return;

        this.playing = true;
        this.currentIndex = 0;

        const frameCount = this.frames.length;

        const updateFrame = () => {
            this.sprite.spriteFrame = this.frames[this.currentIndex];
            this.currentIndex++;

            if (this.currentIndex >= frameCount) {
                if (loop) {
                    this.currentIndex = 0;
                } else {
                    this.playing = false;
                    return; // Stop animation
                }
            }

            tween(this.node)
                .delay(this.frameDuration)
                .call(updateFrame)
                .start();
        };

        updateFrame(); // Start the animation
    }

    stopAnimation() {
        this.playing = false;
        Tween.stopAllByTarget(this.node);
    }
}


