class PanEditor {
  constructor(viewport) {
    this.viewport = viewport;
  }

  enable() {
    this.#addEventListeners();
  }

  disable() {
    this.#removeEventListeners();
  }
  
  #addEventListeners() {
    this.boundMouseDown = this.#handleMouseDown.bind(this);
    this.boundMouseMove = this.#handleMouseMove.bind(this);
    this.boundMouseUp = this.#handleMouseUp.bind(this);

    this.viewport.canvas.addEventListener("mousedown", this.boundMouseDown);
    this.viewport.canvas.addEventListener("mousemove", this.boundMouseMove);
    this.viewport.canvas.addEventListener("mouseup", this.boundMouseUp);
  }

  #removeEventListeners() {
    this.viewport.canvas.removeEventListener("mousedown", this.boundMouseDown);
    this.viewport.canvas.removeEventListener("mousemove", this.boundMouseMove);
    this.viewport.canvas.removeEventListener("mouseup", this.boundMouseUp);
  }

  #handleMouseDown(evt) {
    // pressing button with control key
    if ((evt.button == 0)) {
      this.viewport.drag.start = this.viewport.getMouse(evt);
      this.viewport.drag.active = true;
    }
  }

  #handleMouseMove(evt) {
    if (this.viewport.drag.active) {
      this.viewport.drag.end = this.viewport.getMouse(evt);
      this.viewport.drag.offset = subtract(this.viewport.drag.end, this.viewport.drag.start);
    }
  }

  #handleMouseUp(evt) {
    if (this.viewport.drag.active) {
      this.viewport.offset = add(this.viewport.offset, this.viewport.drag.offset);
    }

    this.viewport.drag = {
      start: new Point(0, 0),
      end: new Point(0, 0),
      offset: new Point(0, 0),
      active: false
    };
  }

  display() {}
}
