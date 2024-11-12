/**
  * @class Controls for a phone device
  */
class PhoneControls {
  constructor(canvas) {
    this.canvas = canvas;
    this.tilt = 0;
    this.canvasAngle = 0;
    this.forward = true;
    this.reverse = false;
    this.#addListeners();
  }

  #addListeners() {
    window.addEventListener("devicemotion", (e) => {
      this.tilt = Math.atan2(
        e.accelerationIncludingGravity.y,
        e.accelerationIncludingGravity.x
      );
      const newCanvasAngle = - this.tilt;
      this.canvasAngle = this.canvasAngle * 6 + newCanvasAngle* 4;
      this.canvas.style.transform = 
        "translate(-50%, -50%) rotate(" + this.canvasAngle + "rad)";
    });

    window.addEventListener("touchstart", (e) => {
      this.forward = false;
      this.reverse = true;
    });

    window.addEventListener("touchend", (e) => {
      this.forward = true;
      this.reverse = false;
    });

  }
}
