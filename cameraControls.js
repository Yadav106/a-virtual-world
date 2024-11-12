class CameraControls {
  /**
  * @param {HTMLCanvasElement} canvas
  */
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.tilt = 0;
    this.forward = true;
    this.reverse = false;

    this.initializing = true;
    this.expectedSize = 0;

    this.tempCanvas = document.createElement("canvas");
    this.tempCtx = this.tempCanvas.getContext("2d");

    this.markerDetector = new MarkerDetector();

    navigator.mediaDevices.getUserMedia({ video: true })
      .then((rawData) => {
        this.video = document.createElement("video");
        this.video.srcObject = rawData;
        this.video.play();
        this.video.onloadeddata = () => {
          this.canvas.width = this.video.videoWidth / 4;
          this.canvas.height = this.video.videoHeight / 4;
          this.tempCanvas.width = this.video.videoWidth;
          this.tempCanvas.height = this.video.videoHeight;
          this.#loop();
        };
      })
      .catch((e) => alert(e));

    this.canvas.addEventListener("wheel", (evt) => {
      this.markerDetector.updateThreshold(-Math.sin(evt.deltaY));
    })
  }

  #processMarkers({ leftMarker, rightMarker }) {
    this.tilt = Math.atan2(
      rightMarker.centroid.y - leftMarker.centroid.y,
      rightMarker.centroid.x - leftMarker.centroid.x
    );

    if (this.initializing) {
      this.expectedSize = (leftMarker.radius + rightMarker.radius) / 2;
    }
    const size = (leftMarker.radius + rightMarker.radius) / 2;
    if (size < this.expectedSize * 0.85) {
      this.reverse = true;
      this.forward = false;
    } else {
      this.forward = true;
      this.reverse = false;
    }

    const wheelCenter = average(
      leftMarker.centroid,
      rightMarker.centroid
    );

    const wheelRadius = distance(wheelCenter, leftMarker.centroid);

    this.ctx.save();
    this.ctx.globalAlpha = 0.4;
    this.ctx.beginPath();
    this.ctx.fillStyle = this.forward ? "blue" : "red";
    this.ctx.arc(
      wheelCenter.x,
      wheelCenter.y,
      wheelRadius,
      0,
      Math.PI * 2
    );
    this.ctx.fill();
    this.ctx.restore();
  }

  #loop() {
    this.initializing = !started;
    this.ctx.save();
    this.ctx.translate(this.canvas.width, 0);
    this.ctx.scale(-1, 1);
    this.ctx.drawImage(
      this.video, 0, 0, this.canvas.width, this.canvas.height
    );
    this.ctx.restore();

    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    const res = this.markerDetector.detect(imageData);

    if (res) {
      this.#processMarkers(res);

      for (let i = 0; i < imageData.data.length; i += 4) {
        imageData.data[i+3] = 0;
      }

      for (const point of [...res.leftMarker.points, ...res.rightMarker.points]) {
        const index = (point.y * imageData.width + point.x) * 4;
        imageData.data[index + 3] = 255;
      }

      this.tempCtx.putImageData(imageData, 0, 0);
      this.ctx.drawImage(this.tempCanvas, 0, 0);
    }

    requestAnimationFrame(() => this.#loop());
  }
}
